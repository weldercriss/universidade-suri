export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly email: string,
    public passwordHash: string,
    public avatarUrl: string,
    public groupType: 'vip' | 'embaixador' | 'admin',
    public tier: string,
    public xp: number,
    public level: number,
    public readonly isAdmin: boolean,
    public readonly createdAt: Date,
    public isActive: boolean = true,
    public profileImage: string | null = null,
  ) {}

  addXp(amount: number): void {
    if (this.isAdmin) return;
    this.xp += amount;
    // Simple level up logic: level changes every 1000 XP
    const newLevel = Math.floor(this.xp / 1000) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
    }
  }
}
