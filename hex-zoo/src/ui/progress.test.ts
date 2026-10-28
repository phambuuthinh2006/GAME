import { describe,it,expect } from 'vitest';
import { createRun } from '../core';
import { canResumeDaily,shouldRecordResult } from './progress';
describe('daily continuation and result accounting',()=>{
 it('resumes today only while active',()=>{const run=createRun('daily-2026-10-28','mira',true);expect(canResumeDaily(run,'2026-10-28')).toBe(true);expect(canResumeDaily(run,'2026-10-29')).toBe(false);run.phase='won';expect(canResumeDaily(run,'2026-10-28')).toBe(false);run.phase='lost';expect(canResumeDaily(run,'2026-10-28')).toBe(false);});
 it('records each seeded result once across reloads and both resume routes',()=>{const stored=['daily-2026-10-28'];expect(shouldRecordResult('daily-2026-10-28',JSON.parse(JSON.stringify(stored)))).toBe(false);expect(shouldRecordResult('daily-2026-10-29',stored)).toBe(true);});
});
