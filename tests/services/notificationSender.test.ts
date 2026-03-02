import type { MessagePayload, ButtonDef, ComponentRow } from '../../src/platform/types';
import {
    buildApprovalNotification,
    buildPlanningNotification,
    buildErrorPopupNotification,
    buildStatusNotification,
    buildProgressNotification,
} from '../../src/services/notificationSender';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract all buttons from every component row in a payload. */
function extractButtons(payload: MessagePayload): readonly ButtonDef[] {
    if (!payload.components) return [];
    return payload.components.flatMap((row) =>
        row.components.filter((c): c is ButtonDef => c.type === 'button'),
    );
}

/** Extract all customIds from a payload's buttons. */
function extractCustomIds(payload: MessagePayload): readonly string[] {
    return extractButtons(payload).map((b) => b.customId);
}

// ---------------------------------------------------------------------------
// buildApprovalNotification
// ---------------------------------------------------------------------------

describe('buildApprovalNotification', () => {
    const baseOpts = {
        title: 'Approval Needed',
        description: 'Tool execution requires approval',
        projectName: 'my-project',
        channelId: 'ch-123',
        toolNames: ['Bash', 'Write'],
    } as const;

    it('returns a MessagePayload with richContent', () => {
        const payload = buildApprovalNotification(baseOpts);
        expect(payload.richContent).toBeDefined();
        expect(payload.richContent!.title).toBe('Approval Needed');
        expect(payload.richContent!.description).toBe('Tool execution requires approval');
    });

    it('uses warning-orange colour (0xFFA500)', () => {
        const payload = buildApprovalNotification(baseOpts);
        expect(payload.richContent!.color).toBe(0xFFA500);
    });

    it('includes Project field', () => {
        const payload = buildApprovalNotification(baseOpts);
        const projectField = payload.richContent!.fields!.find((f) => f.name === 'Project');
        expect(projectField).toBeDefined();
        expect(projectField!.value).toBe('my-project');
    });

    it('includes Tools field when toolNames provided', () => {
        const payload = buildApprovalNotification(baseOpts);
        const toolsField = payload.richContent!.fields!.find((f) => f.name === 'Tools');
        expect(toolsField).toBeDefined();
        expect(toolsField!.value).toBe('Bash, Write');
    });

    it('omits Tools field when toolNames is empty', () => {
        const payload = buildApprovalNotification({ ...baseOpts, toolNames: [] });
        const toolsField = payload.richContent!.fields?.find((f) => f.name === 'Tools');
        expect(toolsField).toBeUndefined();
    });

    it('omits Tools field when toolNames is undefined', () => {
        const { toolNames: _, ...rest } = baseOpts;
        const payload = buildApprovalNotification(rest);
        const toolsField = payload.richContent!.fields?.find((f) => f.name === 'Tools');
        expect(toolsField).toBeUndefined();
    });

    it('has footer "Approval required"', () => {
        const payload = buildApprovalNotification(baseOpts);
        expect(payload.richContent!.footer).toBe('Approval required');
    });

    it('includes a timestamp', () => {
        const payload = buildApprovalNotification(baseOpts);
        expect(payload.richContent!.timestamp).toBeInstanceOf(Date);
    });

    it('contains exactly 3 buttons in one row', () => {
        const payload = buildApprovalNotification(baseOpts);
        expect(payload.components).toHaveLength(1);
        const buttons = extractButtons(payload);
        expect(buttons).toHaveLength(3);
    });

    it('has Allow, Allow Chat, and Deny buttons with correct styles', () => {
        const payload = buildApprovalNotification(baseOpts);
        const buttons = extractButtons(payload);
        expect(buttons[0]).toMatchObject({ label: 'Allow', style: 'success' });
        expect(buttons[1]).toMatchObject({ label: 'Allow Chat', style: 'primary' });
        expect(buttons[2]).toMatchObject({ label: 'Deny', style: 'danger' });
    });

    it('builds customIds with projectName and channelId', () => {
        const payload = buildApprovalNotification(baseOpts);
        const ids = extractCustomIds(payload);
        expect(ids[0]).toBe('approve_action:my-project:ch-123');
        expect(ids[1]).toBe('always_allow_action:my-project:ch-123');
        expect(ids[2]).toBe('deny_action:my-project:ch-123');
    });

    it('builds customIds without channelId when null', () => {
        const payload = buildApprovalNotification({ ...baseOpts, channelId: null });
        const ids = extractCustomIds(payload);
        expect(ids[0]).toBe('approve_action:my-project');
        expect(ids[1]).toBe('always_allow_action:my-project');
        expect(ids[2]).toBe('deny_action:my-project');
    });
});

// ---------------------------------------------------------------------------
// buildPlanningNotification
// ---------------------------------------------------------------------------

describe('buildPlanningNotification', () => {
    const baseOpts = {
        title: 'Planning Mode',
        description: 'Agent is in planning mode',
        projectName: 'ws-a',
        channelId: 'ch-456',
    } as const;

    it('returns a MessagePayload with richContent', () => {
        const payload = buildPlanningNotification(baseOpts);
        expect(payload.richContent).toBeDefined();
        expect(payload.richContent!.title).toBe('Planning Mode');
        expect(payload.richContent!.description).toBe('Agent is in planning mode');
    });

    it('uses blue colour (0x3498DB)', () => {
        const payload = buildPlanningNotification(baseOpts);
        expect(payload.richContent!.color).toBe(0x3498DB);
    });

    it('has footer "Planning mode detected"', () => {
        const payload = buildPlanningNotification(baseOpts);
        expect(payload.richContent!.footer).toBe('Planning mode detected');
    });

    it('includes a timestamp', () => {
        const payload = buildPlanningNotification(baseOpts);
        expect(payload.richContent!.timestamp).toBeInstanceOf(Date);
    });

    it('contains exactly 2 buttons in one row', () => {
        const payload = buildPlanningNotification(baseOpts);
        expect(payload.components).toHaveLength(1);
        const buttons = extractButtons(payload);
        expect(buttons).toHaveLength(2);
    });

    it('has Open and Proceed buttons with correct styles', () => {
        const payload = buildPlanningNotification(baseOpts);
        const buttons = extractButtons(payload);
        expect(buttons[0]).toMatchObject({ label: 'Open', style: 'primary' });
        expect(buttons[1]).toMatchObject({ label: 'Proceed', style: 'success' });
    });

    it('builds customIds with projectName and channelId', () => {
        const payload = buildPlanningNotification(baseOpts);
        const ids = extractCustomIds(payload);
        expect(ids[0]).toBe('planning_open_action:ws-a:ch-456');
        expect(ids[1]).toBe('planning_proceed_action:ws-a:ch-456');
    });

    it('builds customIds without channelId when null', () => {
        const payload = buildPlanningNotification({ ...baseOpts, channelId: null });
        const ids = extractCustomIds(payload);
        expect(ids[0]).toBe('planning_open_action:ws-a');
        expect(ids[1]).toBe('planning_proceed_action:ws-a');
    });
});

// ---------------------------------------------------------------------------
// buildErrorPopupNotification
// ---------------------------------------------------------------------------

describe('buildErrorPopupNotification', () => {
    const baseOpts = {
        title: 'Agent Error',
        errorMessage: 'Something went wrong',
        projectName: 'err-proj',
        channelId: 'ch-err',
    } as const;

    it('returns a MessagePayload with richContent', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        expect(payload.richContent).toBeDefined();
        expect(payload.richContent!.title).toBe('Agent Error');
        expect(payload.richContent!.description).toBe('Something went wrong');
    });

    it('uses red colour (0xE74C3C)', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        expect(payload.richContent!.color).toBe(0xE74C3C);
    });

    it('has footer "Agent error detected"', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        expect(payload.richContent!.footer).toBe('Agent error detected');
    });

    it('includes a timestamp', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        expect(payload.richContent!.timestamp).toBeInstanceOf(Date);
    });

    it('contains exactly 3 buttons in one row', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        expect(payload.components).toHaveLength(1);
        const buttons = extractButtons(payload);
        expect(buttons).toHaveLength(3);
    });

    it('has Dismiss, Copy Debug, and Retry buttons with correct styles', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        const buttons = extractButtons(payload);
        expect(buttons[0]).toMatchObject({ label: 'Dismiss', style: 'secondary' });
        expect(buttons[1]).toMatchObject({ label: 'Copy Debug', style: 'primary' });
        expect(buttons[2]).toMatchObject({ label: 'Retry', style: 'success' });
    });

    it('builds customIds with projectName and channelId', () => {
        const payload = buildErrorPopupNotification(baseOpts);
        const ids = extractCustomIds(payload);
        expect(ids[0]).toBe('error_popup_dismiss_action:err-proj:ch-err');
        expect(ids[1]).toBe('error_popup_copy_debug_action:err-proj:ch-err');
        expect(ids[2]).toBe('error_popup_retry_action:err-proj:ch-err');
    });

    it('builds customIds without channelId when null', () => {
        const payload = buildErrorPopupNotification({ ...baseOpts, channelId: null });
        const ids = extractCustomIds(payload);
        expect(ids[0]).toBe('error_popup_dismiss_action:err-proj');
        expect(ids[1]).toBe('error_popup_copy_debug_action:err-proj');
        expect(ids[2]).toBe('error_popup_retry_action:err-proj');
    });
});

// ---------------------------------------------------------------------------
// buildStatusNotification
// ---------------------------------------------------------------------------

describe('buildStatusNotification', () => {
    it('returns a MessagePayload with title and description', () => {
        const payload = buildStatusNotification({
            title: 'Bot Status',
            description: 'Running smoothly',
        });
        expect(payload.richContent).toBeDefined();
        expect(payload.richContent!.title).toBe('Bot Status');
        expect(payload.richContent!.description).toBe('Running smoothly');
    });

    it('uses provided colour', () => {
        const payload = buildStatusNotification({
            title: 'T',
            description: 'D',
            color: 0x123456,
        });
        expect(payload.richContent!.color).toBe(0x123456);
    });

    it('defaults to neutral grey when colour is omitted', () => {
        const payload = buildStatusNotification({ title: 'T', description: 'D' });
        expect(payload.richContent!.color).toBe(0x95A5A6);
    });

    it('includes fields when provided', () => {
        const payload = buildStatusNotification({
            title: 'T',
            description: 'D',
            fields: [
                { name: 'Uptime', value: '3h', inline: true },
                { name: 'Version', value: '1.0.0' },
            ],
        });
        expect(payload.richContent!.fields).toHaveLength(2);
        expect(payload.richContent!.fields![0]).toMatchObject({
            name: 'Uptime',
            value: '3h',
            inline: true,
        });
        expect(payload.richContent!.fields![1]).toMatchObject({
            name: 'Version',
            value: '1.0.0',
        });
    });

    it('has no fields when omitted', () => {
        const payload = buildStatusNotification({ title: 'T', description: 'D' });
        expect(payload.richContent!.fields).toBeUndefined();
    });

    it('has no components', () => {
        const payload = buildStatusNotification({ title: 'T', description: 'D' });
        expect(payload.components).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// buildProgressNotification
// ---------------------------------------------------------------------------

describe('buildProgressNotification', () => {
    it('uses the phase as the title', () => {
        const payload = buildProgressNotification({ phase: 'Thinking' });
        expect(payload.richContent!.title).toBe('Thinking');
    });

    it('includes detail as description when provided', () => {
        const payload = buildProgressNotification({
            phase: 'Generating',
            detail: 'Processing tokens...',
        });
        expect(payload.richContent!.description).toBe('Processing tokens...');
    });

    it('omits description when detail is not provided', () => {
        const payload = buildProgressNotification({ phase: 'Thinking' });
        expect(payload.richContent!.description).toBeUndefined();
    });

    it('includes Project field when projectName is provided', () => {
        const payload = buildProgressNotification({
            phase: 'Thinking',
            projectName: 'my-proj',
        });
        const projectField = payload.richContent!.fields!.find((f) => f.name === 'Project');
        expect(projectField).toBeDefined();
        expect(projectField!.value).toBe('my-proj');
    });

    it('omits fields when projectName is not provided', () => {
        const payload = buildProgressNotification({ phase: 'Thinking' });
        expect(payload.richContent!.fields).toBeUndefined();
    });

    it('maps "thinking" phase to blue colour', () => {
        const payload = buildProgressNotification({ phase: 'thinking' });
        expect(payload.richContent!.color).toBe(0x3498DB);
    });

    it('maps "generating" phase to green colour', () => {
        const payload = buildProgressNotification({ phase: 'generating' });
        expect(payload.richContent!.color).toBe(0x2ECC71);
    });

    it('maps "error" phase to red colour', () => {
        const payload = buildProgressNotification({ phase: 'error' });
        expect(payload.richContent!.color).toBe(0xE74C3C);
    });

    it('maps "waiting" phase to neutral grey', () => {
        const payload = buildProgressNotification({ phase: 'waiting' });
        expect(payload.richContent!.color).toBe(0x95A5A6);
    });

    it('maps "complete" phase to green colour', () => {
        const payload = buildProgressNotification({ phase: 'complete' });
        expect(payload.richContent!.color).toBe(0x2ECC71);
    });

    it('falls back to neutral grey for unknown phases', () => {
        const payload = buildProgressNotification({ phase: 'unknown-phase' });
        expect(payload.richContent!.color).toBe(0x95A5A6);
    });

    it('is case-insensitive for phase colour lookup', () => {
        const payload = buildProgressNotification({ phase: 'THINKING' });
        expect(payload.richContent!.color).toBe(0x3498DB);
    });

    it('has no components', () => {
        const payload = buildProgressNotification({ phase: 'Thinking' });
        expect(payload.components).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
    it('calling buildApprovalNotification twice returns different objects', () => {
        const opts = {
            title: 'T',
            description: 'D',
            projectName: 'p',
            channelId: 'c',
        } as const;
        const a = buildApprovalNotification(opts);
        const b = buildApprovalNotification(opts);
        expect(a).not.toBe(b);
        expect(a.richContent).not.toBe(b.richContent);
        expect(a.components).not.toBe(b.components);
    });

    it('calling buildPlanningNotification twice returns different objects', () => {
        const opts = {
            title: 'T',
            description: 'D',
            projectName: 'p',
            channelId: 'c',
        } as const;
        const a = buildPlanningNotification(opts);
        const b = buildPlanningNotification(opts);
        expect(a).not.toBe(b);
        expect(a.richContent).not.toBe(b.richContent);
    });

    it('calling buildErrorPopupNotification twice returns different objects', () => {
        const opts = {
            title: 'T',
            errorMessage: 'E',
            projectName: 'p',
            channelId: 'c',
        } as const;
        const a = buildErrorPopupNotification(opts);
        const b = buildErrorPopupNotification(opts);
        expect(a).not.toBe(b);
        expect(a.richContent).not.toBe(b.richContent);
    });

    it('calling buildStatusNotification twice returns different objects', () => {
        const opts = { title: 'T', description: 'D' } as const;
        const a = buildStatusNotification(opts);
        const b = buildStatusNotification(opts);
        expect(a).not.toBe(b);
        expect(a.richContent).not.toBe(b.richContent);
    });

    it('calling buildProgressNotification twice returns different objects', () => {
        const opts = { phase: 'Thinking' } as const;
        const a = buildProgressNotification(opts);
        const b = buildProgressNotification(opts);
        expect(a).not.toBe(b);
        expect(a.richContent).not.toBe(b.richContent);
    });
});

// ---------------------------------------------------------------------------
// CustomId format consistency
// ---------------------------------------------------------------------------

describe('customId format', () => {
    it('approval customIds include projectName and channelId separated by colons', () => {
        const payload = buildApprovalNotification({
            title: 'T',
            description: 'D',
            projectName: 'proj-x',
            channelId: 'ch-y',
        });
        const ids = extractCustomIds(payload);
        for (const id of ids) {
            expect(id).toContain(':proj-x:ch-y');
        }
    });

    it('planning customIds include projectName and channelId separated by colons', () => {
        const payload = buildPlanningNotification({
            title: 'T',
            description: 'D',
            projectName: 'proj-x',
            channelId: 'ch-y',
        });
        const ids = extractCustomIds(payload);
        for (const id of ids) {
            expect(id).toContain(':proj-x:ch-y');
        }
    });

    it('error customIds include projectName and channelId separated by colons', () => {
        const payload = buildErrorPopupNotification({
            title: 'T',
            errorMessage: 'E',
            projectName: 'proj-x',
            channelId: 'ch-y',
        });
        const ids = extractCustomIds(payload);
        for (const id of ids) {
            expect(id).toContain(':proj-x:ch-y');
        }
    });

    it('handles empty-string channelId same as null', () => {
        const payload = buildApprovalNotification({
            title: 'T',
            description: 'D',
            projectName: 'proj',
            channelId: '   ',
        });
        const ids = extractCustomIds(payload);
        // Should NOT contain trailing colon or whitespace segment
        for (const id of ids) {
            expect(id).not.toContain(':   ');
            expect(id.endsWith(':proj')).toBe(true);
        }
    });
});
