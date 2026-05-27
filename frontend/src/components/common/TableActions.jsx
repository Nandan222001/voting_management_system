import { Ban, CheckCircle2, Edit, Eye, Settings, Trash2 } from 'lucide-react';
import ActionDropdown from './ActionDropdown';

const ICONS = {
  view: Eye,
  edit: Edit,
  delete: Trash2,
  approve: CheckCircle2,
  block: Ban,
  unblock: CheckCircle2,
  activate: CheckCircle2,
  settings: Settings,
};

export default function TableActions({ actions = [] }) {
  const normalizedActions = actions
    .filter(Boolean)
    .map((action) => ({
      ...action,
      icon: action.icon || ICONS[action.key],
    }));

  return <ActionDropdown actions={normalizedActions} label="Open row actions" />;
}
