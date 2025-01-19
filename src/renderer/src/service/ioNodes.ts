import { FileWriterNode } from '../nodes/types';
import { fetchQuestion } from './Question';
const { pathSelect } = window.api;

const writeFile = window.NodeJS.fs.promises.writeFile;
const pathJoin = window.NodeJS.path.join;
export const fileReaderNodeFn = async (self: FileWriterNode): Promise<void> => {
  fetchQuestion(self.data.parent ?? '')
    .then(async (res) => {
      const selectedPath = await pathSelect();
      return writeFile(pathJoin(selectedPath, self.data.fileName ?? ''), res.answer);
    })
    .catch(() => {
      console.log('Caught error fileReaderNodeFn');
    });
};

// TODO
// const fileWriterNodeFn = () => {
//
//
