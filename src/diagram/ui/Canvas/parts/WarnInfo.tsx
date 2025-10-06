import type { DiagramNode } from '../../..';

export default function WarnInfo({ node }: { node: DiagramNode }) {

  return (
    !(node.errors && node.errors.length > 0) &&
    node.warns &&
    node.warns.length > 0 && (
      <svg
        style={{ color: 'rgb(245, 158, 11)' }}
        xmlns="http://www.w3.org/2000/svg"
        width="16px"
        height="16px"
        fill="none"
        viewBox="0 0 24 24"
        focusable="false"
        role="img"
        data-icon="node-warning"
      >
        <title>{node.warns}</title>
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1m0 4a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-3 0v-6A1.5 1.5 0 0 1 12 5m0 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3"
          clipRule="evenodd"
        />
      </svg>
    )
  );
}
