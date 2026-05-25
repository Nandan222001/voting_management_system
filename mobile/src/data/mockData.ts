import { Election, VoteRecord, User, LastVoteCast } from '../types';

export const currentUser: User = {
  id: '1',
  fullName: 'Sarah Jenkins',
  email: 'sarah.jenkins@civicvote.com',
  isVerified: true,
  role: 'voter',
  tenantId: 1,
};

export const activeElections: Election[] = [
  {
    id: '1',
    title: '2024 Presidential Primary',
    closingInfo: 'Today, 8:00 PM',
    icon: 'account-balance',
    status: 'active',
  },
  {
    id: '2',
    title: 'District Court Judge Election',
    closingInfo: 'Friday, Mar 15',
    icon: 'gavel',
    status: 'active',
  },
];

export const upcomingElections: Election[] = [
  {
    id: '3',
    title: 'City Council Referendum',
    closingInfo: 'March 25, 2024',
    opensInDays: 12,
    openDate: 'March 25, 2024',
    status: 'upcoming',
  },
  {
    id: '4',
    title: 'State Senator Special Election',
    closingInfo: 'April 12, 2024',
    opensInDays: 30,
    openDate: 'April 12, 2024',
    status: 'upcoming',
  },
];

export const recentVoteRecord: VoteRecord = {
  id: '1',
  electionTitle: 'School Board General Election',
  date: 'Jan 15, 2024',
  verified: true,
  verificationMessage:
    'Your vote was successfully tallied and verified in this election.',
  finalizedDate: 'Finalized Jan 15, 2024',
};

export const lastVoteCast: LastVoteCast = {
  electionTitle: 'City Council',
  date: 'Nov 2023',
};
