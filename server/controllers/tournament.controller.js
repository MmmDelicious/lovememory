const { Tournament, GameParticipant, Transaction, User } = require('../models');
const { Op } = require('sequelize');

class TournamentController {
  // Получить все турниры с фильтрами
  async getTournaments(req, res, next) {
    try {
      const { 
        status, 
        type, 
        entry_fee_max, 
        has_space,
        limit = 20,
        offset = 0 
      } = req.query;

      const where = {};
      
      if (status) where.status = status;
      if (type) where.type = type;
      if (entry_fee_max) where.entry_fee_coins = { [Op.lte]: parseInt(entry_fee_max) };

      const tournaments = await Tournament.findAll({
        where,
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'display_name', 'first_name']
          },
          {
            model: GameParticipant,
            as: 'Participants',
            attributes: ['id', 'user_id']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Фильтр по наличию мест
      let filteredTournaments = tournaments;
      if (has_space === 'true') {
        filteredTournaments = tournaments.filter(t => 
          t.Participants.length < t.max_participants
        );
      }

      res.status(200).json({
        data: filteredTournaments,
        total: filteredTournaments.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить активные турниры
  async getActiveTournaments(req, res, next) {
    try {
      const tournaments = await Tournament.getActiveTournaments();
      res.status(200).json({ data: tournaments });
    } catch (error) {
      next(error);
    }
  }

  // Получить турнир по ID
  async getTournamentById(req, res, next) {
    try {
      const { id } = req.params;
      const tournament = await Tournament.getTournamentWithParticipants(id);
      
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      res.status(200).json({ data: tournament });
    } catch (error) {
      next(error);
    }
  }

  // Создать турнир
  async createTournament(req, res, next) {
    try {
      const creatorId = req.user.id;
      const tournamentData = {
        ...req.body,
        creator_id: creatorId
      };

      const tournament = await Tournament.createTournament(tournamentData);
      
      res.status(201).json({ 
        data: tournament,
        message: 'Tournament created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Зарегистрироваться в турнире
  async registerForTournament(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      await tournament.register(userId);
      
      res.status(200).json({ 
        message: 'Successfully registered for tournament' 
      });
    } catch (error) {
      if (error.message.includes('not accepting registrations') ||
          error.message.includes('full') ||
          error.message.includes('already registered')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Отменить регистрацию в турнире
  async unregisterFromTournament(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      if (tournament.status !== 'registering') {
        return res.status(400).json({ 
          error: 'Cannot unregister from active or completed tournament' 
        });
      }

      // Удаляем участника
      const participant = await GameParticipant.findOne({
        where: { 
          tournament_id: id,
          user_id: userId 
        }
      });

      if (!participant) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      await participant.destroy();

      // Возвращаем entry fee если был
      if (tournament.entry_fee_coins > 0) {
        await Transaction.create({
          pair_id: null,
          user_id: userId,
          tournament_id: id,
          tx_type: 'refund',
          amount: tournament.entry_fee_coins,
          currency: 'coins',
          metadata: {
            tournament_name: tournament.name,
            reason: 'tournament_unregistration'
          }
        });
      }

      res.status(200).json({ 
        message: 'Successfully unregistered from tournament' 
      });
    } catch (error) {
      next(error);
    }
  }

  // Запустить турнир
  async startTournament(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      if (tournament.creator_id !== userId) {
        return res.status(403).json({ error: 'Only creator can start tournament' });
      }

      await tournament.start();
      
      res.status(200).json({ 
        message: 'Tournament started successfully' 
      });
    } catch (error) {
      if (error.message.includes('cannot be started')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Завершить турнир
  async completeTournament(req, res, next) {
    try {
      const { id } = req.params;
      const { winnerId } = req.body;
      const userId = req.user.id;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      if (tournament.creator_id !== userId) {
        return res.status(403).json({ error: 'Only creator can complete tournament' });
      }

      await tournament.complete(winnerId);
      
      res.status(200).json({ 
        message: 'Tournament completed successfully' 
      });
    } catch (error) {
      if (error.message.includes('not active')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Отменить турнир
  async cancelTournament(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      if (tournament.creator_id !== userId) {
        return res.status(403).json({ error: 'Only creator can cancel tournament' });
      }

      if (tournament.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel completed tournament' });
      }

      await tournament.update({
        status: 'cancelled',
        metadata: {
          ...tournament.metadata,
          cancellation_reason: reason,
          cancelled_at: new Date()
        }
      });

      // Возвращаем entry fees всем участникам
      if (tournament.entry_fee_coins > 0) {
        const participants = await GameParticipant.findAll({
          where: { tournament_id: id }
        });

        for (const participant of participants) {
          await Transaction.create({
            pair_id: null,
            user_id: participant.user_id,
            tournament_id: id,
            tx_type: 'refund',
            amount: tournament.entry_fee_coins,
            currency: 'coins',
            metadata: {
              tournament_name: tournament.name,
              reason: 'tournament_cancelled'
            }
          });
        }
      }

      res.status(200).json({ 
        message: 'Tournament cancelled successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить участников турнира
  async getTournamentParticipants(req, res, next) {
    try {
      const { id } = req.params;

      const participants = await GameParticipant.findAll({
        where: { tournament_id: id },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'display_name', 'first_name', 'avatarUrl']
          }
        ],
        order: [['joined_at', 'ASC']]
      });

      res.status(200).json({ data: participants });
    } catch (error) {
      next(error);
    }
  }

  // Получить статистику турнира
  async getTournamentStats(req, res, next) {
    try {
      const { id } = req.params;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      const participantsCount = await GameParticipant.count({
        where: { tournament_id: id }
      });

      const stats = {
        totalParticipants: participantsCount,
        registrationStatus: participantsCount >= tournament.max_participants ? 'full' : 
                           tournament.status === 'registering' ? 'open' : 'closed',
        timeToStart: tournament.start_date ? 
          Math.max(0, Math.floor((new Date(tournament.start_date) - new Date()) / (1000 * 60))) : null,
        estimatedDuration: tournament.metadata.estimated_duration || null
      };

      res.status(200).json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Получить турниры пользователя (созданные)
  async getMyTournaments(req, res, next) {
    try {
      const userId = req.user.id;

      const tournaments = await Tournament.findAll({
        where: { creator_id: userId },
        include: [
          {
            model: GameParticipant,
            as: 'Participants',
            attributes: ['id', 'user_id']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({ data: tournaments });
    } catch (error) {
      next(error);
    }
  }

  // Получить участие пользователя в турнирах
  async getMyParticipations(req, res, next) {
    try {
      const userId = req.user.id;

      const participations = await GameParticipant.findAll({
        where: { 
          user_id: userId,
          tournament_id: { [Op.not]: null }
        },
        include: [
          {
            model: Tournament,
            as: 'Tournament',
            include: [
              {
                model: User,
                as: 'Creator',
                attributes: ['id', 'display_name', 'first_name']
              }
            ]
          }
        ],
        order: [['joined_at', 'DESC']]
      });

      res.status(200).json({ data: participations });
    } catch (error) {
      next(error);
    }
  }

  // Обновить турнир
  async updateTournament(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const tournament = await Tournament.findByPk(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      if (tournament.creator_id !== userId) {
        return res.status(403).json({ error: 'Only creator can update tournament' });
      }

      if (tournament.status !== 'preparing' && tournament.status !== 'registering') {
        return res.status(400).json({ 
          error: 'Cannot update active or completed tournament' 
        });
      }

      // Ограничиваем поля, которые можно обновлять
      const allowedFields = [
        'name', 'description', 'max_participants', 
        'entry_fee_coins', 'prize_pool', 'start_date', 'metadata'
      ];
      
      const filteredUpdateData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      }

      await tournament.update(filteredUpdateData);
      
      res.status(200).json({ 
        data: tournament,
        message: 'Tournament updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TournamentController();
