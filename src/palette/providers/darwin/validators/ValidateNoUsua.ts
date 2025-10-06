import { DiagramModel } from '../../../../diagram';

export const ValidateNoUsua = function (diagram: DiagramModel): Promise<void> {
  // console.log('VALIDATING');
  diagram.nodes.forEach((node) => {
    // console.log(node.name);
    if (node.name?.startsWith('Usua')) {
      node.errors = ['No de usyaia'];
    } else {
      node.errors = [];
    }
  });
  return Promise.resolve();
};
