import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(data: any) {
    const { sendEmail, ...announcementData } = data;

    const announcement = await this.prisma.announcement.create({
      data: {
        title: announcementData.title,
        content: announcementData.content,
        type: announcementData.type || "INFO",
        active: announcementData.active ?? true,
        targetRoles: announcementData.targetRoles || ["ALL"],
      },
    });

    if (sendEmail) {
      try {
        const targetRoles: string[] = announcementData.targetRoles || ["ALL"];
        const isAll = targetRoles.includes("ALL");

        const users = await this.prisma.user.findMany({
          where: isAll ? {} : { role: { in: targetRoles } },
          select: { email: true, name: true },
        });

        this.logger.log(
          `Sending announcement email to ${users.length} recipients`,
        );

        // Send in batches of 10 to avoid rate limiting
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          await Promise.all(
            batch.map((user) =>
              this.mailService
                .sendAnnouncementEmail(user.email, {
                  title: announcement.title,
                  content: announcement.content,
                  type: announcement.type,
                })
                .catch((err) =>
                  this.logger.error(
                    `Failed to send to ${user.email}: ${err.message}`,
                  ),
                ),
            ),
          );
        }

        this.logger.log(`Announcement emails sent to ${users.length} users`);
      } catch (err) {
        this.logger.error(`Failed to send announcement emails: ${err}`);
      }
    }

    return announcement;
  }

  findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: string) {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
