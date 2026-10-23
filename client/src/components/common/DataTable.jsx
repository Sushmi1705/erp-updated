import React, { useState } from 'react';
import { Edit2, Trash2, ChevronRight, ChevronDown, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { confirmAction } from '../../utils/confirmAction';
import { useIsNarrow } from '../../hooks/useIsMobile';

/**
 * The list table every screen in the app inherits.
 *
 * `onRowClick` makes the row itself the drill-down control. Nine pages tell the
 * user "Click a row to…" in their section subtitles, but until this existed the
 * only way in was a small chevron in the Actions column — which sits off-screen
 * whenever the table scrolls horizontally. `selectedRowId` highlights whichever
 * row is currently drilled into.
 *
 * Loading, empty and failed used to look near enough the same that a store
 * keeper could not tell them apart: a fetch that died rendered the same
 * "No records found." as a module nobody has entered data into yet, so a server
 * outage read as an empty screen and the answer to "what do I do now?" was
 * always "nothing". They are three different pictures now, and all three keep
 * the column headers and the table frame, so the page does not jump when the
 * rows finally arrive:
 *
 *   isLoading   five placeholder rows at the real row height
 *   error       a red block that says the list could not be loaded, plus a
 *               "Try again" button when the page passes `onRetry`
 *   empty       what this list holds and what to do next, plus the page's own
 *               Add button when it passes one in `emptyAction`
 *
 * Column config: { header, accessor, render?, align?, sortable?, sortDirection? }
 * `align: 'right'` is for quantities, money and counts — figures line up on the
 * decimal and read down the column. Everything past `columns`/`data` is
 * optional with a working default, so no existing caller needs to change.
 */

/* 6px/10px is the density 80 list screens are already tuned to — a planner is
   measured in rows visible per screen, so this stays where it is. */
const CELL_PADDING = '6px 10px';

/* One text line at the app's 13px/1.4 body setting. Placeholder cells claim
   exactly this, which is why nothing shifts when real rows replace them. */
const LINE_BOX = { display: 'flex', alignItems: 'center', height: '1.4em' };

const SKELETON_ROW_COUNT = 5;
const SKELETON_WIDTHS = ['72%', '46%', '61%', '38%', '80%', '55%'];

const SR_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0
};

const CONTAINER_STYLE = {
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--surface-raised)',
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: '100%'
};

const TABLE_STYLE = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: 'var(--font-body)'
};

/* aria-sort belongs only on a column that can actually be sorted, otherwise a
   screen reader announces "not sorted" on every heading it passes. */
const ariaSortFor = (col) => {
  if (col.sortDirection === 'asc' || col.sortDirection === 'ascending') return 'ascending';
  if (col.sortDirection === 'desc' || col.sortDirection === 'descending') return 'descending';
  if (col.sortable) return 'none';
  return undefined;
};

/* A page may ask for a column in monospace with `mono: true` — a long serial or
   a GSTIN, say. Nothing is mono by default; figures line up through tabular
   numerals in the text face instead. */
const isMono = (col) => col.mono === true;

const alignStyle = (col) => ({
  textAlign: col.align || 'left',
  /* Figures in a right-aligned column share one digit width, so the column
     reads as a stack of numbers instead of ragged text. */
  fontVariantNumeric: col.align === 'right' ? 'tabular-nums' : undefined,
  fontFamily: isMono(col) ? 'var(--font-mono)' : undefined
});

/**
 * The block that fills the table body when there are no rows to draw — used by
 * both the empty and the failed state, so the two read as the same kind of
 * message with different colour and different words.
 */
const StateBlock = ({ icon: Icon, tone, title, message, detail, action }) => {
  const headingColour = tone === 'negative' ? 'var(--status-negative-fg)' : 'var(--text-primary)';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-7) var(--space-6)',
        textAlign: 'center'
      }}
    >
      <Icon size={20} aria-hidden="true" style={{ color: headingColour, flexShrink: 0 }} />
      <div style={{ fontSize: 'var(--font-section)', fontWeight: 'var(--weight-semibold)', color: headingColour }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 'var(--font-body)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-normal)',
          maxWidth: '52ch'
        }}
      >
        {message}
      </div>
      {detail ? (
        <div
          style={{
            fontSize: 'var(--font-caption)',
            color: 'var(--text-muted)',
            maxWidth: '64ch',
            wordBreak: 'break-word'
          }}
        >
          {detail}
        </div>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
};

const RetryButton = ({ onRetry }) => (
  <button
    type="button"
    onClick={onRetry}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: 'var(--space-3) var(--space-5)',
      fontSize: 'var(--font-body)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-inverse)',
      backgroundColor: 'var(--accent-primary-solid)',
      border: '1px solid var(--accent-primary-solid)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer'
    }}
  >
    <RefreshCw size={13} aria-hidden="true" />
    Try again
  </button>
);

const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading,
  customActions,
  expandedRowRender,
  onRowClick,
  selectedRowId,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyAction
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  // Cards are a phone answer. A tablet has room for the real table.
  const isMobile = useIsNarrow();

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const cols = columns || [];
  const hasActions = !!(onEdit || onDelete || customActions);
  /* Never 0: colspan="0" is not the same thing as "one cell" in HTML. */
  const colSpanTotal = Math.max(1, cols.length + (hasActions ? 1 : 0) + (expandedRowRender ? 1 : 0));

  const cellBorderRight = (colIndex) =>
    (colIndex < cols.length - 1 ? '1px solid var(--border-subtle)' : 'none');

  const header = (
    <thead
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backgroundColor: 'var(--surface-sunken)',
        borderBottom: '1px solid var(--border-default)'
      }}
    >
      <tr>
        {expandedRowRender && (
          <th
            scope="col"
            style={{ padding: CELL_PADDING, width: '32px', borderRight: '1px solid var(--border-subtle)' }}
          >
            <span style={SR_ONLY}>Show details</span>
          </th>
        )}
        {cols.map((col, index) => (
          <th
            key={index}
            scope="col"
            aria-sort={ariaSortFor(col)}
            style={{
              padding: CELL_PADDING,
              fontSize: 'var(--font-label)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              borderRight: cellBorderRight(index),
              ...alignStyle(col)
            }}
          >
            {col.header}
          </th>
        ))}
        {hasActions && (
          <th
            scope="col"
            style={{
              padding: CELL_PADDING,
              fontSize: 'var(--font-label)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-primary)',
              width: '100px',
              textAlign: 'right'
            }}
          >
            Actions
          </th>
        )}
      </tr>
    </thead>
  );

  /* Every state renders inside the same frame with the same headings, so the
     user always knows which list they are looking at and the page never
     reflows underneath them. */
  const frame = (caption, body, busy) => (
    <div style={CONTAINER_STYLE}>
      <table style={TABLE_STYLE} aria-busy={busy ? 'true' : undefined}>
        {caption ? <caption style={SR_ONLY}>{caption}</caption> : null}
        {header}
        <tbody>{body}</tbody>
      </table>
    </div>
  );

  /* On a phone the same three states appear without the table chrome — there
     are no column headings to keep steady, because there are no columns. */
  const mobileFrame = (content) => (
    <div style={{
      border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-raised)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden'
    }}>{content}</div>
  );

  if (isMobile && isLoading) {
    return mobileFrame(
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }} aria-busy="true">
        <span style={{ fontSize: 'var(--font-body)', color: 'var(--text-muted)' }}>Loading…</span>
        {[0, 1, 2].map((r) => (
          <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[0, 1, 2].map((c) => (
              <span key={c} aria-hidden="true" style={{
                display: 'block', height: 10, borderRadius: 'var(--radius-md)',
                width: SKELETON_WIDTHS[(r + c) % SKELETON_WIDTHS.length],
                backgroundColor: 'var(--border-subtle)'
              }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isLoading) {
    const skeletonRows = [];
    for (let r = 0; r < SKELETON_ROW_COUNT; r += 1) {
      skeletonRows.push(
        <tr
          key={'placeholder-' + r}
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: r % 2 === 0 ? 'var(--surface-raised)' : 'var(--surface-zebra)'
          }}
        >
          {expandedRowRender && (
            <td style={{ padding: CELL_PADDING, width: '32px', borderRight: '1px solid var(--border-subtle)' }}>
              <span style={LINE_BOX} />
            </td>
          )}
          {cols.map((col, c) => (
            <td key={c} style={{ padding: CELL_PADDING, borderRight: cellBorderRight(c) }}>
              <span style={LINE_BOX}>
                {r === 0 && c === 0 ? (
                  /* One word, so the wait is never mistaken for an empty list.
                     It sits in the first cell rather than in a banner of its
                     own, which would push the rows down and then pull them
                     back up again once the data lands. */
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Loading…</span>
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'block',
                      width: SKELETON_WIDTHS[(r + c) % SKELETON_WIDTHS.length],
                      height: '10px',
                      backgroundColor: 'var(--border-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                )}
              </span>
            </td>
          ))}
          {hasActions && (
            <td style={{ padding: CELL_PADDING }}>
              <span style={LINE_BOX} />
            </td>
          )}
        </tr>
      );
    }
    return frame('Loading records', skeletonRows, true);
  }

  if (error) {
    /* Pages hand us a string, an Error, or just `true`. The technical text is
       kept, but below the sentence that tells the user what to do. */
    const detail = typeof error === 'string' ? error : (error && error.message) || '';
    if (isMobile) {
      return mobileFrame(
        <div style={{ backgroundColor: 'var(--status-negative-bg)' }}>
          <StateBlock
            icon={AlertTriangle}
            tone="negative"
            title="This list could not be loaded"
            message="The records did not come back from the server, so nothing is shown below. This does not mean the list is empty. Check that you are connected, then try again — if it keeps failing, ask your IT support for help."
            detail={detail}
            action={onRetry ? <RetryButton onRetry={onRetry} /> : null}
          />
        </div>
      );
    }
    return frame(
      'This list could not be loaded',
      <tr>
        <td
          colSpan={colSpanTotal}
          style={{
            padding: 0,
            backgroundColor: 'var(--status-negative-bg)',
            borderTop: '1px solid var(--status-negative-border)'
          }}
        >
          <StateBlock
            icon={AlertTriangle}
            tone="negative"
            title="This list could not be loaded"
            message="The records did not come back from the server, so nothing is shown below. This does not mean the list is empty. Check that you are connected, then try again — if it keeps failing, ask your IT support for help."
            detail={detail}
            action={onRetry ? <RetryButton onRetry={onRetry} /> : null}
          />
        </td>
      </tr>,
      false
    );
  }

  if (!data || data.length === 0) {
    const title = emptyTitle || 'Nothing here yet';
    const message =
      emptyMessage ||
      'There are no records in this list. Add the first one, or if you have set filters above, clear them and look again.';
    if (isMobile) {
      return mobileFrame(<StateBlock icon={Inbox} title={title} message={message} action={emptyAction} />);
    }
    return frame(
      title,
      <tr>
        <td colSpan={colSpanTotal} style={{ padding: 0, backgroundColor: 'var(--surface-raised)' }}>
          <StateBlock icon={Inbox} title={title} message={message} action={emptyAction} />
        </td>
      </tr>,
      false
    );
  }

  /* One card per record.
   *
   * A twelve-column table on a 375px screen is a column of unreadable
   * fragments with a horizontal scrollbar under it — a store keeper checking a
   * delivery on the shop floor cannot use that. The card carries the first
   * column as its heading (that is the document number on every list in this
   * app), then each remaining column as a label and a value on one line, which
   * is the same information read top to bottom instead of left to right. The
   * row's own drill-down, the expander and the action buttons all still work.
   */
  if (isMobile) {
    const [titleCol, ...restCols] = cols;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {data.map((row, rowIndex) => {
          const rowId = row._id || rowIndex;
          const isExpanded = !!expandedRows[rowId];
          const isSelected = selectedRowId != null && selectedRowId === row._id;
          return (
            <div
              key={rowId}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } } : undefined}
              style={{
                border: '1px solid var(--border-default)',
                borderLeft: isSelected ? '3px solid var(--accent-primary)' : '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isSelected ? 'var(--surface-selected)' : 'var(--surface-raised)',
                padding: 'var(--space-5) var(--space-6)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                cursor: onRowClick ? 'pointer' : 'default'
              }}
            >
              {titleCol && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', minWidth: 0, wordBreak: 'break-word', ...(isMono(titleCol) ? { fontFamily: 'var(--font-mono)' } : null) }}>
                    {titleCol.render ? titleCol.render(row) : row[titleCol.accessor]}
                  </div>
                  {expandedRowRender && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRow(rowId); }}
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                      aria-expanded={isExpanded}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', padding: 8, margin: -8, flexShrink: 0 }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  )}
                </div>
              )}

              {restCols.map((col, colIndex) => {
                const value = col.render ? col.render(row) : row[col.accessor];
                if (value === null || value === undefined || value === '') return null;
                return (
                  <div key={colIndex} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-5)', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--font-label)', color: 'var(--text-muted)', flexShrink: 0 }}>{col.header}</span>
                    <span style={{
                      fontSize: 'var(--font-body)', color: 'var(--text-primary)', textAlign: 'right',
                      minWidth: 0, wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums',
                      ...(isMono(col) ? { fontFamily: 'var(--font-mono)' } : null)
                    }}>
                      {value}
                    </span>
                  </div>
                );
              })}

              {expandedRowRender && isExpanded && (
                <div onClick={(e) => e.stopPropagation()} style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px -16px -12px', backgroundColor: 'var(--surface-sunken)' }}>
                  {expandedRowRender(row)}
                </div>
              )}

              {hasActions && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}
                >
                  {customActions && customActions(row)}
                  {onEdit && (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(row); }} aria-label="Edit"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-body)', padding: '6px 0' }}>
                      <Edit2 size={15} style={{ pointerEvents: 'none' }} /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" onClick={async (e) => {
                      e.preventDefault(); e.stopPropagation();
                      if (await confirmAction('Delete this record? This cannot be undone.')) onDelete(row);
                    }} aria-label="Delete"
                      style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-body)', padding: '6px 0' }}>
                      <Trash2 size={15} style={{ pointerEvents: 'none' }} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={CONTAINER_STYLE}>
      <table style={TABLE_STYLE}>
        {header}
        <tbody>
          {data.map((row, rowIndex) => {
            const rowId = row._id || rowIndex;
            const isExpanded = !!expandedRows[rowId];
            const baseRowBg = rowIndex % 2 === 0 ? 'var(--surface-raised)' : 'var(--surface-zebra)';

            const isSelected = selectedRowId != null && selectedRowId === row._id;

            return (
              <React.Fragment key={rowId}>
                <tr
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  // Rows carrying a click action must be reachable without a mouse.
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); }
                  } : undefined}
                  style={{
                    borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'var(--surface-selected)' : baseRowBg,
                    cursor: onRowClick ? 'pointer' : 'default',
                    // Marks the row that the panels below are showing.
                    boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-primary)' : 'none'
                  }}
                >
                  {expandedRowRender && (
                    <td style={{ padding: CELL_PADDING, width: '32px', borderRight: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRow(rowId); }}
                        title={isExpanded ? 'Hide details' : 'Show details'}
                        aria-label={isExpanded ? 'Hide details' : 'Show details'}
                        aria-expanded={isExpanded}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0'
                        }}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                  )}
                  {cols.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        padding: CELL_PADDING,
                        color: 'var(--text-secondary)',
                        borderRight: cellBorderRight(colIndex),
                        ...alignStyle(col)
                      }}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                  {hasActions && (
                    <td style={{ padding: '4px 10px', textAlign: 'right' }}>
                      {/* Swallow clicks here so an action button never also fires
                          the row's own drill-down handler. Covers page-supplied
                          customActions, which cannot know about onRowClick. */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}
                      >
                        {customActions && customActions(row)}
                        {onEdit && (
                          <button type="button" className="btn-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(row); }} title="Edit" aria-label="Edit" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex' }}>
                            <Edit2 size={14} style={{ pointerEvents: 'none' }} />
                          </button>
                        )}
                        {onDelete && (
                          <button type="button" className="btn-icon" onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (await confirmAction('Delete this record? This cannot be undone.')) {
                              onDelete(row);
                            }
                          }} title="Delete" aria-label="Delete" style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedRowRender && isExpanded && (
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                    <td colSpan={colSpanTotal} style={{ padding: '0' }}>
                      {expandedRowRender(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
