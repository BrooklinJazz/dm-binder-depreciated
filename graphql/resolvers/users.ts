import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { IAuthData, IInput, IUserInput } from '../../models/types';
import User from '../../models/users';

export default {
  Query: {
    login: async (
      root: any,
      { input: { email, password } }: IInput<IUserInput>
    ): Promise<IAuthData> => {
      const user = await User.findOne({ email });
      const validPassword =
        user && (await bcrypt.compare(password, user.password));
      if (!user || !validPassword) {
        throw new Error('Invalid login credentials');
      }
      console.log('MY TOKEN', process.env.JWT_SECRET_KEY);
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        // NOTE using an empty string when undefined to avoid a type issue.
        process.env.JWT_SECRET_KEY || '',
        { expiresIn: '1h' }
      );
      return { userId: user.id, token, tokenExpiration: 1 };
    }
  },
  Mutation: {
    createUser: async (
      root: any,
      { input: { email, password } }: IInput<IUserInput>
    ): Promise<{ email: string }> => {
      try {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          throw new Error('That email is already taken');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
          email,
          password: hashedPassword
        });
        const createdUser = await user.save();
        return { email: createdUser.email };
      } catch (error) {
        throw error;
      }
    }
  }
};