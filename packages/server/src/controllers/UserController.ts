import { OAuth2Client } from 'google-auth-library';
import { EMembership, IGoogleUser, IUser, LoginBody } from 'interfaces';
import { validatorGeneric } from '../dtos/GenericDTOValidator';
import { UserCreateDTO } from '../dtos/UserCreateDTO';
import { UserUpdateMembershipDTO } from '../dtos/UserUpdateMembershipDTO';
import { LoginBodyDTO } from '../dtos/VoteAddDTO';
import { UserModel } from '../models/UserModel';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * Controller for the user-related calls. It handles all the logic between routing and the database access.
 */
export class UserController {
    /**
     * If the user identified by userId1 is admin it updates the membership of the user identified by userId2 to the membership given.
     * @param userId1 id of the user making the request.
     * @param userId2 id of the poll.
     * @param body new membershep to set. It should be an array of valid [[IMembership]].
     * @returns Returns true if the membership could be set or false if otherwise and no errors arised.
     * @throws Error 400 if the body is not a valid membership array or missing.
     * @throws Error 401 if the user is not admin.
     * @throws Error 404 if the users are not found.
     */
    public static async updateMembership(
        userId1: string,
        userId2: string,
        body: unknown,
    ): Promise<boolean> {
        if (await UserController.isAdmin(userId1)) {
            const membership: Array<EMembership> = (
                await validatorGeneric<UserUpdateMembershipDTO>(UserUpdateMembershipDTO, body)
            ).membership;
            const user = await UserModel.get(userId2);
            if (!user) throw new ErrorHandler(404, `User ${userId2} not found.`);
            return UserModel.updateMembership(userId2, membership);
        } else {
            throw new ErrorHandler(401, 'Only admins are authorized');
        }
    }

    public static async login(body: unknown): Promise<boolean> {
        const client = new OAuth2Client(process.env.CLIENT_ID);
        const { token } = await validatorGeneric<LoginBody>(LoginBodyDTO, body);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });
        const { name, email, picture, sub } = ticket.getPayload();
        const user = await db.user.upsert({
            where: { email: email },
            update: { name, picture },
            create: { name, email, picture },
        });
        this._controller.addUser();
        const accessToken: AccessTokenInterface = {
            userId: res.locals['user'].userId,
        };
        return true;
    }
    /**
     * Tries to add the user to the database.
     * @param body user to add, should be castable to [[IGoogleUser]].
     * @returns true if the user could be added or false if otherwise and no errors arised.
     * @throws Error 400 if the body is not a valid user.
     */
    public static async addUser(body: unknown): Promise<boolean> {
        const googleUser: IGoogleUser = await validatorGeneric<UserCreateDTO>(UserCreateDTO, body);
        const newUser: IUser = {
            userId: googleUser.id,
            email:
                Array.isArray(googleUser.emails) && googleUser.emails.length > 0
                    ? googleUser.emails[0].value
                    : 'notAvailable',
            name: googleUser.displayName,
            membership: [EMembership.ALL],
        };
        return UserModel.add(newUser);
    }

    /**
     * Returns the users if the requester is admin.
     * @param userId id of the user making the request.
     * @returns Returns an array with the users as [[IUser]].
     * @throws Error 401 if the user is not admin.
     * @throws Error 404 if the user is not found.
     */
    public static async getUsers(userId: string): Promise<Array<IUser>> {
        if (await UserController.isAdmin(userId)) {
            return UserModel.getAll();
        } else {
            throw new ErrorHandler(401, 'Only admins are authorized');
        }
    }

    /**
     * Returns the user requested.
     * @param userId1 id of the user making the request.
     * @param userId2 id of the user requested.
     * @returns Returns the user as [[IUser]].
     * @throws Error 401 if the user is not admin or the ids are not the same.
     * @throws Error 404 if the users are not found.
     */
    public static async getUser(userId1: string, userId2: string): Promise<IUser> {
        if ((await UserController.isAdmin(userId1)) || userId1 === userId2) {
            const user = await UserModel.get(userId2);
            if (!user) throw new ErrorHandler(404, `User ${userId2} not found.`);
            return user;
        } else {
            throw new ErrorHandler(401, 'Only admins or same users are authorized');
        }
    }

    /**
     * Returns true if the user is admin, false otherwise.
     * @param userId id of the user.
     * @returns Returns true or false, according to the membership status of the user.
     * @throws Error 404 if the user is not found.
     */
    public static async isAdmin(userId: string): Promise<boolean> {
        const user = await UserModel.get(userId);
        if (!user) throw new ErrorHandler(404, `User ${userId} not found.`);
        return user.membership.includes(EMembership.ADMIN);
    }
}
