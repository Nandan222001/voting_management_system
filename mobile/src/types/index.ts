export interface Election {
  id: string;
  title: string;
  closingInfo: string;
  icon: string;
  status: 'active' | 'upcoming' | 'completed';
  opensInDays?: number;
  openDate?: string;
}

export interface VoteRecord {
  id: string;
  electionTitle: string;
  date: string;
  verified: boolean;
  verificationMessage: string;
  finalizedDate: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  role: 'voter' | 'admin' | 'superadmin';
  tenantId?: number;
}

export interface LastVoteCast {
  electionTitle: string;
  date: string;
}

export type RootTabParamList = {
  Dashboard: undefined;
  'My Votes': undefined;
  Profile: undefined;
};
