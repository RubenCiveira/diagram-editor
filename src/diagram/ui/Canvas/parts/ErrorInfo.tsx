import type { DiagramNode } from '../../..';

export default function ErrorInfo({ node }: { node: DiagramNode }) {
  return (
    node.errors &&
    node.errors.length > 0 && (
      <svg
        style={{ color: 'rgb(234, 31, 48)' }}
        xmlns="http://www.w3.org/2000/svg"
        width="16px"
        height="16px"
        fill="none"
        viewBox="0 0 24 24"
        focusable="false"
        role="img"
        data-icon="node-error"
      >
        <title>{node.errors}</title>
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1m5.56 5.44a1.5 1.5 0 0 0-2.12 0L12 9.878l-3.44-3.44A1.5 1.5 0 1 0 6.44 8.56L9.878 12l-3.44 3.44a1.5 1.5 0 1 0 2.122 2.12L12 14.122l3.44 3.44.114.103a1.5 1.5 0 0 0 2.11-2.11l-.104-.114L14.122 12l3.44-3.44a1.5 1.5 0 0 0 0-2.12"
          clipRule="evenodd"
        ></path>
      </svg>
    )
  );
}
