/**
 * Sends e-mails one by one in the background, so a request never waits for dozens of e-mails
 * and the Resend rate limit (about 2 requests per second) is respected.
 * The queue lives in memory - e-mails that were not sent yet are lost on restart
 * (in-app notifications are stored in the database, so nothing important disappears).
 */
type EmailJob = () => Promise<void>;

const INTERVAL_MS = process.env.NODE_ENV === 'test' ? 0 : 600;

const queue: EmailJob[] = [];
let processing: Promise<void> | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const processQueue = async () => {
    while (queue.length > 0) {
        const job = queue.shift()!;
        try {
            await job();
        } catch (error) {
            console.error('Failed to send e-mail:', error);
        }
        if (INTERVAL_MS > 0 && queue.length > 0) await wait(INTERVAL_MS);
    }
    processing = null;
};

export const enqueueEmail = (job: EmailJob) => {
    queue.push(job);
    if (!processing) processing = processQueue();
};

// Resolves when all queued e-mails were processed (used by tests)
export const drainEmailQueue = async () => {
    while (processing) await processing;
};
