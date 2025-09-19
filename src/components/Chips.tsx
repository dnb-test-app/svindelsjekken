import { Tag } from '@dnb/eufemia';

interface ChipsProps {
  items: string[];
  variant?: 'default' | 'clickable' | 'addable' | 'removable';
}

export default function Chips({ items, variant = 'default' }: ChipsProps) {
  if (!items || items.length === 0) return null;
  
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {items.map((item, idx) => (
        <Tag key={idx} variant={variant}>
          {item}
        </Tag>
      ))}
    </div>
  );
}