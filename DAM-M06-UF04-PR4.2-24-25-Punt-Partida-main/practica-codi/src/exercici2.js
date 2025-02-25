const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATA_SUBFOLDER = 'steamreviews';
const CSV_GAMES_FILE_NAME = 'games.csv';
const CSV_REVIEWS_FILE_NAME = 'reviews.csv';
const OUTPUT_JSON_NAME = 'exercici2_resposta.json';

async function readCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

async function analyzeSentiment(text) {
    try {
        const response = await fetch(`${process.env.CHAT_API_OLLAMA_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.CHAT_API_OLLAMA_MODEL_TEXT,
                prompt: `Analyze the sentiment of this text and respond with only one word (positive/negative/neutral): "${text}"`,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response.trim().toLowerCase();
    } catch (error) {
        console.error('Error detallat en la petició a Ollama:', error);
        return 'error';
    }
}

async function main() {
    try {
        const dataPath = process.env.DATA_PATH;
        if (!dataPath || !process.env.CHAT_API_OLLAMA_URL || !process.env.CHAT_API_OLLAMA_MODEL_TEXT) {
            throw new Error('Falten variables de entorn necessàries.');
        }

        const gamesFilePath = path.join(__dirname, dataPath, DATA_SUBFOLDER, CSV_GAMES_FILE_NAME);
        const reviewsFilePath = path.join(__dirname, dataPath, DATA_SUBFOLDER, CSV_REVIEWS_FILE_NAME);
        const outputJsonPath = path.join(__dirname, dataPath, OUTPUT_JSON_NAME);

        if (!fs.existsSync(gamesFilePath) || !fs.existsSync(reviewsFilePath)) {
            throw new Error('Algun dels fitxers CSV no existeix');
        }

        const games = await readCSV(gamesFilePath);
        const reviews = await readCSV(reviewsFilePath);

        const selectedGames = games.slice(0, 2);
        const output = {
            timestamp: new Date().toISOString(),
            games: []
        };

        console.log('\n=== Estadístiques de Sentiment per Joc ===');

        for (const game of selectedGames) {
            console.log(`\nJoc: ${game.name} (ID: ${game.appid})`);
            const gameReviews = reviews.filter(r => r.app_id === game.appid).slice(0, 2);

            let stats = { positive: 0, negative: 0, neutral: 0, error: 0 };

            for (const review of gameReviews) {
                const sentiment = await analyzeSentiment(review.content);
                if (sentiment in stats) stats[sentiment]++;
            }

            output.games.push({
                appid: game.appid,
                name: game.name,
                statistics: stats
            });

            console.log(`Positives: ${stats.positive}, Negatives: ${stats.negative}, Neutres: ${stats.neutral}, Errors: ${stats.error}`);
        }

        fs.writeFileSync(outputJsonPath, JSON.stringify(output, null, 2));
        console.log(`\nResultat guardat a: ${outputJsonPath}`);
    } catch (error) {
        console.error('Error durant la execució:', error.message);
    }
}

main();
