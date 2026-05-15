import mongoose, { ClientSession } from 'mongoose';

export async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  
  try {
    let result!: T;
    
    await session.withTransaction(async (txSession) => {
      result = await callback(txSession);
    });
    
    return result;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
}
