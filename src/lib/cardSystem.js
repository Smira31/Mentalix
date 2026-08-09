const previewEnvironment =
  import.meta.env.DEV
  || import.meta.env.VERCEL_ENV === 'preview'


export const cardSystemPreviewEnabled =
  previewEnvironment
  && new URLSearchParams(window.location.search).get('card_system') === '1'
