export interface Account {
  id?: number;
  type: string;
  name: string;
  address: string;
  port?: number | null;
  username: string;
  password: string;
  remark: string;
  created_at?: number;
  updated_at?: number;
  used_at?: number;
}

export type AccountType = string;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  website: '站点地址',
  ssh: 'SSH 主机',
  windows: 'Windows 主机',
};
