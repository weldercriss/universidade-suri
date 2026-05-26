export class Certificate {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly courseId: string,
    public readonly verificationCode: string,
    public readonly issuedAt: Date,
  ) {}
}
