/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Panel,
  addEdge
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { formatQuestionsToNode, nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { RunButton } from './components/RunButton';
import { RunReportPanel } from './components/RunReportPanel';
import { Logo } from './components/Logo';
import { fetchQuestions, mongodbObjectId, postQuestion } from './service/Question';
import { NodeDetails } from './components/NodeDetails';
import { AppNode, DebugNode, FileWriterNode, NodeSelectorInterface } from './nodes/types';
import { LeftSideBar } from './components/LeftSideBar';
import { NodeSelector } from './components/NodeSelector';
import { DebugUtils } from './utils/debugUtils';
import FeedBackFlow from './components/FeedBackFlow';
import { postFeedBack } from './service/FeedBack';
import { checkLocalStorageKey, setLocalStorageKeyValue } from './utils/localStorage';
import { fileReaderNodeFn } from './service/ioNodes';

const initialEdges = [
  { id: 'e1-2', source: 'a', target: 'c' },
  { id: 'e2-3', source: 'c', target: 'd' }
];

const initialNodes: AppNode[] = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);
  const [pending_nodes, setPendingNodes] = useState<AppNode[]>([]);
  const [debugNode, setDebugNode] = useState<DebugNode | null>(null);
  const [isFeedBackFlowOpen, setIsFeedBackFlowOpen] = useState(false);
  useEffect(() => {
    async function fetchInitNodes() {
      try {
        const id = checkLocalStorageKey('gumloop-userId');
        if (!id) {
          setLocalStorageKeyValue('gumloop-userId', Math.random().toString(36).substring(2, 15));
        }
        setUserId(id);
        const questions = await fetchQuestions(userId);
        const { appNodes, edges } = formatQuestionsToNode(questions, userId);
        setNodes(appNodes);
        setEdges(edges);
      } catch (error) {
        console.error('Error in fetchInitNodes:', error);
      }
    }
    fetchInitNodes();
  }, [userId]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as AppNode);
  };

  const onRun = () => {
    setIsPanelOpen(true);
  };

  const addNewNode = () => {
    const newNode: AppNode = {
      id: mongodbObjectId(),
      type: 'question-node',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        parent: undefined,
        label: 'New Question',
        question: 'New Question',
        answer: '',
        func: (node, debug_id) => postQuestion(userId, node, debug_id)
      }
    };
    setNodes((nodes) => [...nodes, newNode]);
  };

  const addDebugNode = () => {
    const newNode: DebugNode = {
      id: `debug-${Math.random().toString(36).substring(2, 15)}`,
      type: 'debug-node',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        label: 'Debug Node',
        func: () => {},
        debugUtils: new DebugUtils()
      }
    };
    // TODO: hack for now
    setNodes((nodes) => [...nodes, newNode as AppNode]);
    setDebugNode(newNode);
  };

  const addFileWriterNode = () => {
    const fileWriterNode: FileWriterNode = {
      id: mongodbObjectId(),
      type: 'filewriter-node',
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        isNew: true,
        func: fileReaderNodeFn
      }
    };
    setNodes((nodes) => [...nodes, fileWriterNode as any]);
    // Assumed that IO nodes are used for current 'flow'
    setPendingNodes((nodes) => [...nodes, fileWriterNode as any]);
  };

  const addFileReaderNode = () => {
    // const fileReaderNode: FileReaderNode = {
    //   id: `debug-${Math.random().toString(36).substring(2, 15)}`,
    //   type: 'filereader-node',
    //   position: { x: Math.random() * 500, y: Math.random() * 500 },
    //   data: {
    //     label: 'Debug Node',
    //     func: (data: string) => {},
    //     debugUtils: new DebugUtils()
    //   }
    // };
    alert('NOT IMPLEMENTED');
    // setNodes((nodes) => [...nodes, newNode as AppNode]);
  };
  const removeDebugNode = () => {
    setNodes((nodes) => nodes.filter((n) => n.id !== debugNode?.id));
    setDebugNode(null);
  };

  const handleAskQuestion = (node: AppNode, question: string) => {
    const newNodes = nodes.map((n) =>
      n.id === node.id ? { ...n, data: { ...n.data, pending_question: question } } : n
    );
    setNodes(newNodes);
    setPendingNodes([...newNodes.filter((n) => n.data.pending_question)]);
  };

  const handleRemoveQuestion = (node: AppNode) => {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, pending_question: '' } } : n))
    );
    setPendingNodes((nodes) => nodes.filter((n) => n.id !== node.id));
  };

  // Kinda hard coded for now
  const submitFeedBack = (feedback: {
    question1: string;
    question2: string;
    question3: string;
  }) => {
    postFeedBack(feedback, userId)
      .then(() => {
        console.log('Feedback submitted');
      })
      .catch(() => {
        console.log('Failed to submit feedback');
      });
    // close anyways
    setIsFeedBackFlowOpen(false);
  };

  const toggleFeedBackFlow = () => {
    setIsFeedBackFlowOpen(!isFeedBackFlowOpen);
  };

  const onConnect = useCallback(
    (params: any) => {
      // top node / parent
      const sourceNode = nodes.find((node) => node.id === params.source);
      // bottom node / child
      const targetNode = nodes.find((node) => node.id === params.target);

      // Prevent connection if both nodes are root nodes
      if (!sourceNode || !targetNode || (sourceNode.data.isRoot && targetNode.data.isRoot)) {
        return;
      }
      const nodeWithUpdatedParent = {
        ...targetNode,
        data: {
          ...targetNode.data,
          parent: sourceNode?.id
        }
      };

      setNodes((nodes) =>
        nodes.map((n) => (n.id === nodeWithUpdatedParent.id ? nodeWithUpdatedParent : n))
      );

      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges, nodes, setNodes]
  );

  // Mock fake nodes VERY BAD WILL NEED TO CHANGE THIS LATER
  // BTW this should not be an object. I made it an interface
  // because I assumed that "categories" here is "Node library", and that
  // I would add "Custome Nodes" in the future
  const ALL_NODES: NodeSelectorInterface = {
    categories: [
      {
        name: 'AI',
        description: 'Using AI for various tasks',
        nodes: [
          {
            name: 'Ask AI',
            func: addNewNode,
            nodeId: '1',
            favorite: false
          },
          {
            name: 'Summarizer',
            func: () => {},
            nodeId: '2',
            favorite: false
          },
          {
            name: 'Categorizer',
            func: () => {},
            nodeId: '3',
            favorite: false
          },
          {
            name: 'Scorer',
            func: () => {},
            nodeId: '4',
            favorite: false
          },
          {
            name: 'Extractor',
            func: () => {},
            nodeId: '5',
            favorite: false
          }
        ]
      },
      {
        name: 'Notification',
        description: 'Send notifications to users',
        nodes: [
          {
            name: 'notification1',
            func: () => {},
            nodeId: '6',
            favorite: false
          },
          {
            name: 'notification2',
            func: () => {},
            nodeId: '7',
            favorite: false
          }
        ]
      },
      {
        name: 'Flow Basics',
        description: 'Essential components for workflow construction',
        nodes: [
          {
            name: 'Debug Node',
            func: addDebugNode,
            nodeId: '8',
            favorite: false
          },
          {
            name: 'Input',
            func: () => {},
            nodeId: '9',
            favorite: false
          },
          {
            name: 'Datetime',
            func: () => {},
            nodeId: '10',
            favorite: false
          }
        ]
      },
      {
        name: 'I/O Nodes',
        description: 'Nodes that interact with your file system directly',
        nodes: [
          {
            name: 'File Writer',
            func: addFileWriterNode,
            nodeId: '11',
            favorite: false
          },
          {
            name: 'File Reader',
            func: addFileReaderNode,
            nodeId: '12',
            favorite: false
          }
        ]
      },
      {
        name: 'Favorite',
        description: 'Favorite nodes',
        nodes: [
          {
            name: 'Ask AI',
            func: addNewNode,
            nodeId: '1',
            favorite: false
          },
          {
            name: 'Summarizer',
            func: () => {},
            nodeId: '2',
            favorite: false
          },
          {
            name: 'Categorizer',
            func: () => {},
            nodeId: '3',
            favorite: false
          },
          {
            name: 'Scorer',
            func: () => {},
            nodeId: '4',
            favorite: false
          },
          {
            name: 'Extractor',
            func: () => {},
            nodeId: '5',
            favorite: false
          },
          {
            name: 'Debug Node',
            func: addDebugNode,
            nodeId: '8',
            favorite: false
          },
          {
            name: 'Input',
            func: () => {},
            nodeId: '9',
            favorite: false
          },
          {
            name: 'Datetime',
            func: () => {},
            nodeId: '10',
            favorite: false
          },

          {
            name: 'notification1',
            func: () => {},
            nodeId: '6',
            favorite: false
          },
          {
            name: 'notification2',
            func: () => {},
            nodeId: '7',
            favorite: false
          }
        ]
      }
    ]
  };

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      fitView
      deleteKeyCode={null}
    >
      <Background />
      <Logo toggleFeedBackFlow={toggleFeedBackFlow} />
      <Panel position="top-center">
        {isFeedBackFlowOpen && (
          <FeedBackFlow onSubmit={submitFeedBack} onClose={() => setIsFeedBackFlowOpen(false)} />
        )}
      </Panel>
      <RunButton onRun={onRun} />
      <LeftSideBar>
        <NodeSelector removeDebugNode={removeDebugNode} allNodes={ALL_NODES} />
      </LeftSideBar>
      <RunReportPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        pending_nodes={pending_nodes}
        debugNode={debugNode}
        nodes={nodes}
        edges={edges}
      />
      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          onClose={(reload) => {
            setSelectedNode(null);
            if (reload) {
              window.location.reload();
            }
          }}
          onAskQuestion={handleAskQuestion}
          onRemoveQuestion={handleRemoveQuestion}
        />
      )}
    </ReactFlow>
  );
}
