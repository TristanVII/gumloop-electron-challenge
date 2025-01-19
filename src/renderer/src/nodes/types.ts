import type { Node } from '@xyflow/react';
import { DebugUtils } from '../utils/debugUtils';

export type QuestionNode = Node<
  {
    question: string;
    answer: string;
    label: string;
    parent?: string;
    pending_question?: string;
    isRoot?: boolean;
    func?: (question: QuestionNode, debug_id?: string | null) => Promise<Response>;
  },
  'question-node'
>;
export type DebugNode = Node<
  {
    label: string;
    func?: () => void;
    debugUtils?: DebugUtils;
  },
  'debug-node'
>;

export type FileReaderNode = Node<
  {
    parent?: string;
    func?: (data: string) => Promise<void>;
  },
  'filereader-node'
>;

export type FileWriterNode = Node<
  {
    parent?: string;
    fileName?: string;
    // required now to know whether or not it was used
    isNew: boolean;
    func?: (self: FileWriterNode) => Promise<void>;
  },
  'filewriter-node'
>;

export type AppNode = QuestionNode;

// type for ALL_NODES

export interface NodeItem {
  name: string;
  func: () => void;
  nodeId: string;
  favorite: boolean;
}

export interface Category {
  name: string;
  description: string;
  nodes: NodeItem[];
}

export interface NodeSelectorInterface {
  categories: Category[];
}
