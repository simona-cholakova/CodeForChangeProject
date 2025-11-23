//file za funckii sto sporeduvaat similarity 

function cosineSimilarity(a,b) {
    let dot = 0 , normA = 0, normB = 0;
    for(let i = 0; i < a.length; i++){
        dot += a[i] * b[i];
        normA += a[i] * a[i]
        normB += b[i] * b[i]

    } 
    return dot /  (Math.sqrt(normA) * Math.sqrt(normB));
}

//za sea placeholder
function getEmbeddingPlaceHolder(text){
     return Array.from(text).map( c => c.charCodeAt(0) / 255 );
}

module.exports = {cosineSimilarity, getEmbeddingPlaceHolder};