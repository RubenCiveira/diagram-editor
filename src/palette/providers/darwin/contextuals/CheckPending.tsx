import { GitCompareArrows } from 'lucide-react';
import { NodeActionItem } from '../../../../metadata/FormDefinition';

export class CheckPending implements NodeActionItem {
  public readonly title = 'Check pending';
  public readonly label = 'Check pending';
  public readonly icon = (<GitCompareArrows />);
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

