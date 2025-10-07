import { GitPullRequest } from 'lucide-react';
import { NodeActionItem } from '../../../../metadata/FormDefinition';

export class Merge implements NodeActionItem {
  public readonly title = 'Merge feature';
  public readonly label = 'Merge feature';
  public readonly icon = (<GitPullRequest />);
  public readonly url: string;
  public readonly disabled?: boolean;
  public readonly danger?: boolean;

  public constructor(props: { url: string; disabled?: boolean; danger?: boolean }) {
    this.url = props.url;
    this.disabled = props.disabled;
    this.danger = props.danger;
  }

  onClick(): Promise<void> | void {
    alert("GOGOGOG");
  }
}

