export const fonts = {
  heading: 'Poppins_700Bold',
  subheading: 'Poppins_600SemiBold',
  body: undefined, // system default (SF Pro on iOS, Roboto on Android)
  button: 'Poppins_700Bold',
  badge: 'Poppins_700Bold',
} as const;

export const typography = {
  pageTitle: {
    fontFamily: 'Poppins_700Bold' as string,
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  sectionHeading: {
    fontFamily: 'Poppins_700Bold' as string,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 26,
  },
  subheading: {
    fontFamily: 'Poppins_600SemiBold' as string,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  button: {
    fontFamily: 'Poppins_700Bold' as string,
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  badge: {
    fontFamily: 'Poppins_700Bold' as string,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
};

export const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};
