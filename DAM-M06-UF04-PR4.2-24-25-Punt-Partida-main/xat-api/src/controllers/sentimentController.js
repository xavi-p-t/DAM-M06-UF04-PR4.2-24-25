const { Sentiment } = require('../models/Sentiment');
const logger = require('../config/logger');
const { analyzeText } = require('../services/sentimentService');

exports.analyzeSentiment = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'El camp "text" és obligatori' });
        }

        const sentimentResult = analyzeText(text);

        const newSentiment = await Sentiment.create({
            text,
            sentiment: sentimentResult.sentiment,
            score: sentimentResult.score,
        });

        logger.info('Anàlisi de sentiment guardada correctament', { id: newSentiment.id });

        res.status(201).json(newSentiment);
    } catch (error) {
        logger.error('Error en analitzar el sentiment', { error: error.message });
        res.status(500).json({ error: 'Error intern del servidor' });
    }
};
