import { HardDriveUpload } from 'lucide-react';
import { NodeActionItem } from '../../../DiagramElementType';

export class Deploy implements NodeActionItem {
  public readonly title = 'Deploy micro';
  public readonly label = 'Deploy micro';
  public readonly icon = (<HardDriveUpload />);
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

