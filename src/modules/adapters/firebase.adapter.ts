import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseException } from '../../common/exceptions';
import { IPushAdapter } from './adapters.interface';

@Injectable()
export class FirebaseAdapter implements IPushAdapter {
  private readonly logger = new Logger(FirebaseAdapter.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor() {
    try {
      // Initialize Firebase Admin SDK
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('⚠️ Firebase credentials not fully configured');
        this.messaging = null;
        return;
      }

      const credentials = {
        projectId,
        privateKey,
        clientEmail,
      };

      // Initialize Firebase app
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(credentials as any),
        });
      }

      this.messaging = admin.messaging();
      this.logger.log('✓ Firebase Admin SDK initialized');
    } catch (error) {
      this.logger.error(`✗ Firebase initialization error: ${error.message}`);
    }
  }

  async send(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    try {
      if (!this.messaging) {
        throw new FirebaseException('Firebase not initialized');
      }

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data,
        token: deviceToken,
      };

      const messageId = await this.messaging.send(message);
      this.logger.log(`✓ Push notification sent. Message ID: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`✗ Failed to send push notification: ${error.message}`);
      throw new FirebaseException(`Failed to send push notification: ${error.message}`);
    }
  }

  async sendMulticast(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<admin.messaging.BatchResponse> {
    try {
      if (!this.messaging) {
        throw new FirebaseException('Firebase not initialized');
      }

      // Filter out invalid tokens
      const validTokens = deviceTokens.filter(t => t && t.length > 0);

      if (validTokens.length === 0) {
        throw new FirebaseException('No valid device tokens provided');
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data,
        tokens: validTokens,
      };

      const response = await this.messaging.sendMulticast(message);

      this.logger.log(
        `✓ Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );

      // Log failures
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(
              `⚠️ Failed to send to token ${validTokens[idx]}: ${resp.error?.message}`,
            );
          }
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`✗ Failed to send multicast notification: ${error.message}`);
      throw new FirebaseException(`Failed to send multicast notification: ${error.message}`);
    }
  }

  /**
   * Subscribe multiple tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<any> {
    try {
      if (!this.messaging) {
        throw new FirebaseException('Firebase not initialized');
      }

      const validTokens = tokens.filter(t => t && t.length > 0);

      if (validTokens.length === 0) {
        throw new FirebaseException('No valid device tokens provided');
      }

      const response = await this.messaging.subscribeToTopic(validTokens, topic);

      this.logger.log(`✓ Subscribed ${response.successCount} tokens to topic "${topic}"`);

      return response;
    } catch (error) {
      this.logger.error(`✗ Failed to subscribe to topic: ${error.message}`);
      throw new FirebaseException(`Failed to subscribe to topic: ${error.message}`);
    }
  }

  /**
   * Unsubscribe multiple tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<any> {
    try {
      if (!this.messaging) {
        throw new FirebaseException('Firebase not initialized');
      }

      const validTokens = tokens.filter(t => t && t.length > 0);

      if (validTokens.length === 0) {
        throw new FirebaseException('No valid device tokens provided');
      }

      const response = await this.messaging.unsubscribeFromTopic(validTokens, topic);

      this.logger.log(`✓ Unsubscribed ${response.successCount} tokens from topic "${topic}"`);

      return response;
    } catch (error) {
      this.logger.error(`✗ Failed to unsubscribe from topic: ${error.message}`);
      throw new FirebaseException(`Failed to unsubscribe from topic: ${error.message}`);
    }
  }

  /**
   * Send message to a topic
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    try {
      if (!this.messaging) {
        throw new FirebaseException('Firebase not initialized');
      }

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data,
        topic,
      };

      const messageId = await this.messaging.send(message);

      this.logger.log(`✓ Topic message sent to "${topic}". Message ID: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`✗ Failed to send topic message: ${error.message}`);
      throw new FirebaseException(`Failed to send topic message: ${error.message}`);
    }
  }

  isInitialized(): boolean {
    return !!this.messaging;
  }
}
