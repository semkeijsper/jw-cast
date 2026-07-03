export interface WhatsAppChannel {
  link: string;
  ctaLabel: string;
  description: string;
  buttonLabel: string;
}

export const whatsappChannels: Record<string, WhatsAppChannel> = {
  nl: {
    link: 'https://whatsapp.com/channel/0029VbCZoduFcow3Cqnyd71W',
    ctaLabel: 'Ontvang meldingen',
    description:
      'Blijf op de hoogte van nieuwe artikelen, video\'s en mededelingen op JW.ORG via WhatsApp.',
    buttonLabel: 'Kanaal volgen',
  },
  en: {
    link: 'https://whatsapp.com/channel/0029VbCWyc79xVJiIP7FEs1e',
    ctaLabel: 'Get notifications',
    description:
      'Stay informed about new articles, videos, and announcements on JW.ORG through WhatsApp.',
    buttonLabel: 'Join channel',
  },
};
