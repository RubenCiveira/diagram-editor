import { ServerCog } from 'lucide-react';
import { NodeActionItem } from '../../../DiagramElementType';

export class DeployConfig implements NodeActionItem {
  public readonly title = 'Deploy conf';
  public readonly label = 'Deploy conf';
  public readonly icon = (<ServerCog />);
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

