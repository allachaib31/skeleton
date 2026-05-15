import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  targetId: { type: Schema.Types.ObjectId },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

auditLogSchema.post('save', function(doc) {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const { emitToAdmins, ADMIN_AUDIT_LOG } = require('../../sockets/socket.events');
    emitToAdmins(ADMIN_AUDIT_LOG, doc);
  } catch (e) {
    console.error('Socket emit error on AuditLog', e);
  }
});

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
