import { DataTypes, Model, Sequelize } from 'sequelize';
import { 
  RelationshipProfile as IRelationshipProfile,
  LoveLanguages,
  RelationshipGraph,
  ActivityPatterns,
  CommunicationStyle,
  AIInteractionQuality
} from '../types/intelligence.types';

interface RelationshipProfileAttributes extends IRelationshipProfile {}

interface RelationshipProfileCreationAttributes extends Partial<RelationshipProfileAttributes> {
  userId: string;
}

class RelationshipProfile extends Model<RelationshipProfileAttributes, RelationshipProfileCreationAttributes> 
  implements RelationshipProfileAttributes {
  
  public id!: string;
  public userId!: string;
  public loveLanguages!: LoveLanguages;
  public relationshipGraph!: RelationshipGraph;
  public sentimentTrend!: number;
  public activityPatterns!: ActivityPatterns;
  public communicationStyle!: CommunicationStyle;
  public aiInteractionQuality!: AIInteractionQuality;
  public version!: number;
  public lastAnalyzedAt!: Date;
  public analysisStatus!: 'pending' | 'analyzing' | 'completed' | 'error';
  public createdAt!: Date;
  public updatedAt!: Date;

  // Instance methods
  public getDominantLoveLanguage(): keyof LoveLanguages {
    const languages = this.loveLanguages;
    return (Object.keys(languages) as Array<keyof LoveLanguages>)
      .reduce((a, b) => languages[a] > languages[b] ? a : b);
  }

  public getRelationshipStrength(): number {
    return this.relationshipGraph.overallStrength || 75;
  }

  public needsAnalysis(): boolean {
    const daysSinceAnalysis = (new Date().getTime() - new Date(this.lastAnalyzedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceAnalysis > 7 || this.analysisStatus === 'pending';
  }

  public updateInteractionQuality(rating: number): void {
    const quality = { ...this.aiInteractionQuality };
    quality.totalInteractions += 1;
    
    if (rating > 0) {
      quality.positiveResponses += 1;
    } else if (rating < 0) {
      quality.negativeResponses += 1;
    }
    
    quality.averageRating = (quality.averageRating * (quality.totalInteractions - 1) + rating) / quality.totalInteractions;
    quality.lastInteractionAt = new Date();
    
    this.aiInteractionQuality = quality;
    this.changed('aiInteractionQuality', true);
  }

  // Static methods
  public static async findOrCreateByUserId(userId: string): Promise<{ profile: RelationshipProfile; created: boolean }> {
    const [profile, created] = await RelationshipProfile.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        loveLanguages: {
          physical_touch: 0.2,
          quality_time: 0.2,
          words_of_affirmation: 0.2,
          acts_of_service: 0.2,
          receiving_gifts: 0.2
        },
        relationshipGraph: {
          nodes: [],
          connections: [],
          overallStrength: 75
        },
        sentimentTrend: 0.0,
        activityPatterns: {
          timePreferences: { morning: 0.1, afternoon: 0.3, evening: 0.5, night: 0.1 },
          budgetLevel: 'medium',
          categoryPreferences: {},
          frequencyScore: 0.5
        },
        communicationStyle: {
          preferredTone: 'friendly',
          responseLength: 'medium',
          humorLevel: 0.7,
          formalityLevel: 0.3
        },
        aiInteractionQuality: {
          averageRating: 0,
          totalInteractions: 0,
          positiveResponses: 0,
          negativeResponses: 0,
          lastInteractionAt: undefined
        },
        version: 1,
        lastAnalyzedAt: new Date(),
        analysisStatus: 'pending'
      }
    });
    return { profile, created };
  }
}

export const initRelationshipProfile = (sequelize: Sequelize): typeof RelationshipProfile => {
  RelationshipProfile.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    loveLanguages: {
      type: DataTypes.JSON,
      defaultValue: {
        physical_touch: 0.2,
        quality_time: 0.2,
        words_of_affirmation: 0.2,
        acts_of_service: 0.2,
        receiving_gifts: 0.2
      }
    },
    relationshipGraph: {
      type: DataTypes.JSON,
      defaultValue: {
        nodes: [],
        connections: [],
        overallStrength: 75
      }
    },
    sentimentTrend: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: -1.0,
        max: 1.0
      }
    },
    activityPatterns: {
      type: DataTypes.JSON,
      defaultValue: {
        timePreferences: { morning: 0.1, afternoon: 0.3, evening: 0.5, night: 0.1 },
        budgetLevel: 'medium',
        categoryPreferences: {},
        frequencyScore: 0.5
      }
    },
    communicationStyle: {
      type: DataTypes.JSON,
      defaultValue: {
        preferredTone: 'friendly',
        responseLength: 'medium',
        humorLevel: 0.7,
        formalityLevel: 0.3
      }
    },
    aiInteractionQuality: {
      type: DataTypes.JSON,
      defaultValue: {
        averageRating: 0,
        totalInteractions: 0,
        positiveResponses: 0,
        negativeResponses: 0,
        lastInteractionAt: null
      }
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version for migration compatibility'
    },
    lastAnalyzedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    analysisStatus: {
      type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'error'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    tableName: 'relationship_profiles',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['lastAnalyzedAt']
      },
      {
        fields: ['analysisStatus']
      }
    ]
  });

  return RelationshipProfile;
};

export default RelationshipProfile;
