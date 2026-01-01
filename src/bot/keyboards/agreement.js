export const agreementKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '✅ Принимаю условия', callback_data: 'agreement_accept' }],
      [{ text: '❌ Отказаться', callback_data: 'agreement_decline' }]
    ]
  }
};

export const declineConfirmKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '✅ Да, отказаться', callback_data: 'agreement_confirm_decline' }],
      [{ text: '↩️ Вернуться к соглашению', callback_data: 'agreement_back' }]
    ]
  }
};