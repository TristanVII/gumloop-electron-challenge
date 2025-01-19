import { Handle, Position } from '@xyflow/react';
import React, { memo, useState } from 'react';
import { FileWriterNode } from './types';

const FileWriterNodeComponent = memo(({ data }: { data: FileWriterNode['data'] }) => {
  const [fileName, setFileName] = useState(data.fileName);
  console.log(data)
  const onChange = (name: string): void => {
    setFileName(name);
    data.fileName = name;
  };
  const style: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '10px',
    minWidth: '200px',
    maxWidth: '300px',
    wordWrap: 'break-word'
  };

  return (
    <div style={style}>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          backgroundColor: '#f0f9ff', // light blue background
          margin: '-10px -10px 8px -10px',
          padding: '4px 10px',
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
          borderBottom: '1px solid #bae6fd',
          color: '#0369a1', // blue text
          fontSize: '0.75rem',
          fontWeight: '600'
        }}
      >
        FILE WRITER
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={fileName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter file name..."
          className="w-full p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

FileWriterNodeComponent.displayName = 'FileWriterNodeComponent';
export default FileWriterNodeComponent;
