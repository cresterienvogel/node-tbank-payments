export type TbankInitRequest = {
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  Description?: string;
  NotificationURL?: string;
  SuccessURL?: string;
  FailURL?: string;
  Token?: string;
};

export type TbankInitResponse = {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  PaymentId?: string;
  PaymentURL?: string;
};

export type TbankGetStateRequest = {
  TerminalKey: string;
  PaymentId: string;
  Token?: string;
};

export type TbankGetStateResponse = {
  Success: boolean;
  ErrorCode: string;
  Status?: string;
  PaymentId?: string;
  Message?: string;
  Details?: string;
};

export type TbankCancelRequest = {
  TerminalKey: string;
  PaymentId: string;
  Token?: string;
};

export type TbankCancelResponse = {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
};