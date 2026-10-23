import React from 'react';
import Modal from '../../../components/common/Modal';
import { Award, AlertTriangle, CheckCircle2, Wrench, ShieldCheck, UserPlus, Users } from 'lucide-react';

const SkillMatrixAuditModal = ({
  isOpen,
  onClose,
  periods = [],
  onPlanPeriod
}) => {
  const skillConstraintPeriods = periods.filter(p => p.status === 'Skill Constraint');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workforce Skill Matrix & Certification Audit"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Audits operator skill certification levels (Basic, Intermediate, Expert) against required routing operations to prevent quality escapes and uncertified production execution.
        </p>

        {/* Skill Tier Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '12px', fontWeight: 700 }}>
              <Award size={14} /> Expert
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Critical Quality CMM, Precision Tooling, Robotic Welding Setup.
            </div>
          </div>

          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
              <Wrench size={14} /> Intermediate
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Press Setting, Sub-assembly Fixture Loading, Visual Inspection.
            </div>
          </div>

          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '12px', fontWeight: 700 }}>
              <CheckCircle2 size={14} /> Standard
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Blanking Feeder, Material Binning, Secondary Packaging.
            </div>
          </div>
        </div>

        {/* Audit Results */}
        <div>
          <h4 style={{ margin: '8px 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Active Skill Constraint Shifts ({skillConstraintPeriods.length})
          </h4>

          {skillConstraintPeriods.length === 0 ? (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--accent-success)',
              fontSize: '12px'
            }}>
              <ShieldCheck size={20} />
              <span>All scheduled shifts currently have certified operator skill coverage for all planned routing steps.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {skillConstraintPeriods.map(p => (
                <div
                  key={p._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {p.departmentId?.name} — {p.shiftName} Shift
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#a855f7',
                        color: '#ffffff'
                      }}>
                        EXPERT DEFICIT
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Roster has {p.headcount} operators ({p.availableHrs.toFixed(1)}h available), but contains routing steps requiring certified <strong>Expert</strong> craftsmen.
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onPlanPeriod(p);
                    }}
                    style={{
                      background: '#a855f7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <UserPlus size={13} />
                    Deploy Expert
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close Audit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SkillMatrixAuditModal;
