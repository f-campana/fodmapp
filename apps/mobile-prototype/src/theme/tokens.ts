export const theme = {
  color: {
    canvas: '#f4f7f5',
    surface: '#ffffff',
    surfaceMuted: '#eef3ef',
    text: '#172033',
    textMuted: '#52607a',
    border: '#d8e0e8',
    accent: '#2f8f60',
    accentStrong: '#26724d',
    accentSoft: '#dbf2e6',
    infoSoft: '#e8f0fe',
    danger: '#c53030'
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28
  },
  shadow: {
    card: {
      elevation: 2,
      shadowColor: '#0b172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10
    }
  }
} as const;
