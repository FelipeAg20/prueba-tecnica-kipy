import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User.entity';
import { UserEntity } from '../database/entities/UserEntity';
import { Email } from '../../domain/value-objects/Email.vo';
import { UserType } from '../../domain/entities/UserType.enum';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.userEntityRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.userEntityRepository.findOne({ where: { email } });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  async save(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.userEntityRepository.save(entity);
    return this.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    const entity = this.toEntity(user);
    const saved = await this.userEntityRepository.save(entity);
    return this.toDomain(saved);
  }

  async findAll(): Promise<User[]> {
    const entities = await this.userEntityRepository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.userEntityRepository.delete(id);
  }

  private toDomain(entity: UserEntity): User {
    return new User(entity.id, entity.name, Email.create(entity.email), entity.type as UserType);
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.name = user.name;
    entity.email = user.email.getValue();
    entity.type = user.type;
    return entity;
  }
}
