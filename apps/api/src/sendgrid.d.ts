declare module '@sendgrid/mail' {
  const sg: {
    setApiKey(key: string): void;
    send(msg: { to: string; from: string; subject: string; text: string; html?: string }): Promise<unknown>;
  };
  export default sg;
}
