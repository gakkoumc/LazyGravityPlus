/**
 * Platform-agnostic notification builders.
 *
 * Every exported function is **pure** — no side effects, no I/O.
 * They return a `MessagePayload` that any platform adapter can render.
 */

import type {
    MessagePayload,
    ButtonDef,
    ButtonStyle,
    ComponentRow,
    RichContentField,
} from '../platform/types';
import {
    createRichContent,
    withTitle,
    withDescription,
    withColor,
    addField,
    withFooter,
    withTimestamp,
    pipe,
} from '../platform/richContentBuilder';

// ---------------------------------------------------------------------------
// Custom-ID prefix constants (must stay in sync with cdpBridgeManager)
// ---------------------------------------------------------------------------

const APPROVE_ACTION_PREFIX = 'approve_action';
const ALWAYS_ALLOW_ACTION_PREFIX = 'always_allow_action';
const DENY_ACTION_PREFIX = 'deny_action';
const PLANNING_OPEN_ACTION_PREFIX = 'planning_open_action';
const PLANNING_PROCEED_ACTION_PREFIX = 'planning_proceed_action';
const ERROR_POPUP_DISMISS_ACTION_PREFIX = 'error_popup_dismiss_action';
const ERROR_POPUP_COPY_DEBUG_ACTION_PREFIX = 'error_popup_copy_debug_action';
const ERROR_POPUP_RETRY_ACTION_PREFIX = 'error_popup_retry_action';

// ---------------------------------------------------------------------------
// Notification colours
// ---------------------------------------------------------------------------

/** Warning orange — used for approval requests. */
const COLOR_APPROVAL = 0xFFA500;
/** Blue — used for planning / informational notifications. */
const COLOR_PLANNING = 0x3498DB;
/** Red — used for error notifications. */
const COLOR_ERROR = 0xE74C3C;
/** Green — used for success / progress notifications. */
const COLOR_SUCCESS = 0x2ECC71;
/** Grey — used for neutral status notifications. */
const COLOR_NEUTRAL = 0x95A5A6;

// ---------------------------------------------------------------------------
// Phase → colour mapping for progress notifications
// ---------------------------------------------------------------------------

const PHASE_COLOURS: Readonly<Record<string, number>> = {
    thinking: COLOR_PLANNING,
    generating: COLOR_SUCCESS,
    error: COLOR_ERROR,
    waiting: COLOR_NEUTRAL,
    complete: COLOR_SUCCESS,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Create a single button definition. */
function button(customId: string, label: string, style: ButtonStyle): ButtonDef {
    return { type: 'button', customId, label, style };
}

/** Wrap one or more buttons into a component row. */
function buttonRow(...buttons: readonly ButtonDef[]): ComponentRow {
    return { components: buttons };
}

/**
 * Build a colon-separated customId following the project convention:
 *   `<prefix>:<projectName>` or `<prefix>:<projectName>:<channelId>`
 */
function customId(prefix: string, projectName: string, channelId: string | null): string {
    if (channelId !== null && channelId.trim().length > 0) {
        return `${prefix}:${projectName}:${channelId}`;
    }
    return `${prefix}:${projectName}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Build the approval notification message. */
export function buildApprovalNotification(opts: {
    readonly title: string;
    readonly description: string;
    readonly projectName: string;
    readonly channelId: string | null;
    /** List of tool names requesting approval. */
    readonly toolNames?: readonly string[];
}): MessagePayload {
    const { title, description, projectName, channelId, toolNames } = opts;

    const richContent = pipe(
        createRichContent(),
        (rc) => withTitle(rc, title),
        (rc) => withDescription(rc, description),
        (rc) => withColor(rc, COLOR_APPROVAL),
        (rc) => addField(rc, 'Project', projectName, true),
        (rc) =>
            toolNames && toolNames.length > 0
                ? addField(rc, 'Tools', toolNames.join(', '), true)
                : rc,
        (rc) => withFooter(rc, 'Approval required'),
        (rc) => withTimestamp(rc),
    );

    const components: readonly ComponentRow[] = [
        buttonRow(
            button(customId(APPROVE_ACTION_PREFIX, projectName, channelId), 'Allow', 'success'),
            button(customId(ALWAYS_ALLOW_ACTION_PREFIX, projectName, channelId), 'Allow Chat', 'primary'),
            button(customId(DENY_ACTION_PREFIX, projectName, channelId), 'Deny', 'danger'),
        ),
    ];

    return { richContent, components };
}

/** Build the planning mode notification message. */
export function buildPlanningNotification(opts: {
    readonly title: string;
    readonly description: string;
    readonly projectName: string;
    readonly channelId: string | null;
}): MessagePayload {
    const { title, description, projectName, channelId } = opts;

    const richContent = pipe(
        createRichContent(),
        (rc) => withTitle(rc, title),
        (rc) => withDescription(rc, description),
        (rc) => withColor(rc, COLOR_PLANNING),
        (rc) => withFooter(rc, 'Planning mode detected'),
        (rc) => withTimestamp(rc),
    );

    const components: readonly ComponentRow[] = [
        buttonRow(
            button(customId(PLANNING_OPEN_ACTION_PREFIX, projectName, channelId), 'Open', 'primary'),
            button(customId(PLANNING_PROCEED_ACTION_PREFIX, projectName, channelId), 'Proceed', 'success'),
        ),
    ];

    return { richContent, components };
}

/** Build the error popup notification message. */
export function buildErrorPopupNotification(opts: {
    readonly title: string;
    readonly errorMessage: string;
    readonly projectName: string;
    readonly channelId: string | null;
}): MessagePayload {
    const { title, errorMessage, projectName, channelId } = opts;

    const richContent = pipe(
        createRichContent(),
        (rc) => withTitle(rc, title),
        (rc) => withDescription(rc, errorMessage),
        (rc) => withColor(rc, COLOR_ERROR),
        (rc) => withFooter(rc, 'Agent error detected'),
        (rc) => withTimestamp(rc),
    );

    const components: readonly ComponentRow[] = [
        buttonRow(
            button(customId(ERROR_POPUP_DISMISS_ACTION_PREFIX, projectName, channelId), 'Dismiss', 'secondary'),
            button(customId(ERROR_POPUP_COPY_DEBUG_ACTION_PREFIX, projectName, channelId), 'Copy Debug', 'primary'),
            button(customId(ERROR_POPUP_RETRY_ACTION_PREFIX, projectName, channelId), 'Retry', 'success'),
        ),
    ];

    return { richContent, components };
}

/** Build a simple status embed. */
export function buildStatusNotification(opts: {
    readonly title: string;
    readonly description: string;
    readonly color?: number;
    readonly fields?: readonly { readonly name: string; readonly value: string; readonly inline?: boolean }[];
}): MessagePayload {
    const { title, description, color, fields } = opts;

    const richContent = pipe(
        createRichContent(),
        (rc) => withTitle(rc, title),
        (rc) => withDescription(rc, description),
        (rc) => withColor(rc, color ?? COLOR_NEUTRAL),
        (rc) =>
            fields
                ? fields.reduce<typeof rc>(
                      (acc, f) => addField(acc, f.name, f.value, f.inline),
                      rc,
                  )
                : rc,
    );

    return { richContent };
}

/** Build a progress / phase notification (e.g. "Thinking...", "Generating..."). */
export function buildProgressNotification(opts: {
    readonly phase: string;
    readonly projectName?: string;
    readonly detail?: string;
}): MessagePayload {
    const { phase, projectName, detail } = opts;

    const phaseColor = PHASE_COLOURS[phase.toLowerCase()] ?? COLOR_NEUTRAL;

    const richContent = pipe(
        createRichContent(),
        (rc) => withTitle(rc, phase),
        (rc) => (detail ? withDescription(rc, detail) : rc),
        (rc) => withColor(rc, phaseColor),
        (rc) => (projectName ? addField(rc, 'Project', projectName, true) : rc),
    );

    return { richContent };
}
