// Personal Money Relationship Tracker — Design System
export const Colors = {
  bg: '#111318',
  bgSecondary: '#181A21',
  card: '#1E2028',
  cardAlt: '#242730',
  cardBorder: 'rgba(255,255,255,0.07)',
  surface: '#2A2D38',
  surfaceAlt: '#32364A',

  primary: '#5B5BD6',
  primaryLight: '#7B7BF5',
  primaryBg: 'rgba(91,91,214,0.15)',

  text: '#F0F2FF',
  textSub: '#8B90A8',
  textMuted: '#52566A',

  income: '#34C77B',
  incomeBg: 'rgba(52,199,123,0.12)',
  expense: '#E5534B',
  expenseBg: 'rgba(229,83,75,0.12)',
  pending: '#F5A524',
  pendingBg: 'rgba(245,165,36,0.12)',
  transfer: '#60A5FA',
  transferBg: 'rgba(96,165,250,0.12)',

  divider: 'rgba(255,255,255,0.07)',
  overlay: 'rgba(17,19,24,0.92)',

  // Account type colors
  accounts: {
    bank:        { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',  icon: '🏦' },
    credit_card: { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)', icon: '💳' },
    upi:         { color: '#34C77B', bg: 'rgba(52,199,123,0.15)',  icon: '📲' },
    cash:        { color: '#F5A524', bg: 'rgba(245,165,36,0.15)',  icon: '💵' },
    wallet:      { color: '#FB923C', bg: 'rgba(251,146,60,0.15)',  icon: '👛' },
  },

  // Settlement type colors
  settlements: {
    lent:     { color: '#34C77B', bg: 'rgba(52,199,123,0.12)',  label: 'Lent',     icon: '↗' },
    borrowed: { color: '#E5534B', bg: 'rgba(229,83,75,0.12)',   label: 'Borrowed', icon: '↙' },
    split:    { color: '#F5A524', bg: 'rgba(245,165,36,0.12)',  label: 'Split',    icon: '⇄' },
  },

  // Transaction categories
  categories: {
    food:          { color: '#FF6B6B', icon: '🍔', label: 'Food & Dining' },
    transport:     { color: '#4ECDC4', icon: '🚗', label: 'Transport' },
    shopping:      { color: '#F472B6', icon: '🛍️', label: 'Shopping' },
    health:        { color: '#FF6B9D', icon: '❤️', label: 'Health' },
    entertainment: { color: '#60A5FA', icon: '🎬', label: 'Entertainment' },
    utilities:     { color: '#FBBF24', icon: '⚡', label: 'Bills & Utilities' },
    rent:          { color: '#F5A524', icon: '🏠', label: 'Rent & Housing' },
    education:     { color: '#38BDF8', icon: '📚', label: 'Education' },
    salary:        { color: '#34C77B', icon: '💼', label: 'Salary' },
    transfer:      { color: '#A78BFA', icon: '↔', label: 'Transfer' },
    repayment:     { color: '#34C77B', icon: '✓', label: 'Repayment' },
    other:         { color: '#94A3B8', icon: '📦', label: 'Other' },
  },

  // Avatar colors for people
  avatarColors: [
    '#5B5BD6', '#34C77B', '#E5534B', '#F5A524', '#60A5FA',
    '#A78BFA', '#FB923C', '#F472B6', '#4ECDC4', '#38BDF8',
  ],
};

export const currency = '₹';
