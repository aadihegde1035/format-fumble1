// Common misspellings for frequent English words
const commonMisspellings: Record<string, string[]> = {
  "the": ["teh", "hte", "te", "tthe"],
  "and": ["adn", "nad", "annd", "an"],
  "that": ["taht", "tht", "thta", "tat"],
  "have": ["ahve", "hve", "haev", "habe"],
  "for": ["fro", "fo", "forr", "fer"],
  "not": ["ont", "nto", "nott", "nat"],
  "with": ["wiht", "wth", "witth", "whit"],
  "this": ["tihs", "ths", "thsi", "tis"],
  "from": ["form", "frm", "fomr", "frum"],
  "they": ["tehy", "thye", "tey", "tthey"],
  "would": ["wuold", "wold", "wouuld", "wuld"],
  "there": ["theer", "ther", "tehre", "thre"],
  "their": ["thier", "thir", "theri", "ther"],
  "what": ["waht", "wht", "whta", "wat"],
  "which": ["whcih", "wich", "whihc", "wich"],
  "when": ["wehn", "whn", "wheen", "wen"],
  "were": ["wrer", "wre", "weer", "whre"],
  "will": ["wlil", "wll", "willl", "wiil"],
  "more": ["mroe", "mor", "moer", "morre"],
  "about": ["aobut", "abut", "abuot", "abotu"],
};

// Common punctuation errors
const punctuationErrors: Record<string, string[]> = {
  ".": ["", ",", "!", "?", ".."],
  ",": ["", ".", ";", ":"],
  "!": ["", ".", "?", "!!"],
  "?": ["", ".", "!", "??"],
  ";": ["", ":", ",", "."],
  ":": ["", ";", "."],
  "'": ["", "`"],
};

// Split HTML content into text and non-text parts
export const parseHtml = (html: string) => {
  // Simple regex to split HTML, preserving tags and text content separately
  const parts: string[] = [];
  let currentPosition = 0;
  let isInTag = false;
  let currentPart = "";

  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    
    if (char === "<") {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = "";
      }
      isInTag = true;
      currentPart += char;
    } else if (char === ">") {
      currentPart += char;
      parts.push(currentPart);
      currentPart = "";
      isInTag = false;
    } else {
      currentPart += char;
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts.map(part => ({
    isTag: part.startsWith("<") && part.endsWith(">"),
    content: part
  }));
};

// Function to corrupt text based on percentage
export const corruptText = (
  content: string, 
  corruptionPercentage: number
): { plainVersion: string; markedVersion: string } => {
  const parts = parseHtml(content);
  
  let plainResult = "";
  let markedResult = "";

  parts.forEach(part => {
    if (part.isTag) {
      // Preserve HTML tags unchanged
      plainResult += part.content;
      markedResult += part.content;
    } else {
      // Process only text content for corruption
      const words = part.content.split(/(\s+)/).filter(Boolean);
      
      words.forEach((word, index) => {
        const isWhitespace = /^\s+$/.test(word);
        
        // Don't corrupt whitespace
        if (isWhitespace) {
          plainResult += word;
          markedResult += word;
          return;
        }
        
        // Check if we should corrupt this word (based on percentage)
        const shouldCorrupt = Math.random() * 100 < corruptionPercentage;
        
        if (!shouldCorrupt) {
          plainResult += word;
          markedResult += word;
          return;
        }
        
        // Determine type of corruption
        const corruptionType = Math.floor(Math.random() * 3);
        
        // Simple word with potential punctuation at end
        const matches = word.match(/^(\w+)([^\w]*)$/);
        const wordOnly = matches ? matches[1].toLowerCase() : word.toLowerCase();
        const punctuation = matches ? matches[2] : "";
        
        switch (corruptionType) {
          case 0: // Spelling error
            if (commonMisspellings[wordOnly] && wordOnly.length > 2) {
              const misspellings = commonMisspellings[wordOnly];
              const misspelled = misspellings[Math.floor(Math.random() * misspellings.length)];
              // Preserve original capitalization
              const preserveCase = word[0] === word[0].toUpperCase() 
                ? misspelled.charAt(0).toUpperCase() + misspelled.slice(1)
                : misspelled;
              
              plainResult += preserveCase + punctuation;
              markedResult += `<span class="spelling-error">${preserveCase}</span>${punctuation}`;
            } else {
              // Create random spelling error if not in our list
              if (wordOnly.length > 3) {
                const pos = 1 + Math.floor(Math.random() * (wordOnly.length - 2));
                const misspelled = wordOnly.substring(0, pos) + 
                  wordOnly.charAt(pos + 1) + 
                  wordOnly.charAt(pos) + 
                  wordOnly.substring(pos + 2);
                
                // Preserve original capitalization
                const preserveCase = word[0] === word[0].toUpperCase() 
                  ? misspelled.charAt(0).toUpperCase() + misspelled.slice(1)
                  : misspelled;
                
                plainResult += preserveCase + punctuation;
                markedResult += `<span class="spelling-error">${preserveCase}</span>${punctuation}`;
              } else {
                plainResult += word;
                markedResult += word;
              }
            }
            break;
            
          case 1: // Punctuation error
            if (punctuation && punctuationErrors[punctuation]) {
              const errors = punctuationErrors[punctuation];
              const errorPunctuation = errors[Math.floor(Math.random() * errors.length)];
              
              plainResult += wordOnly + errorPunctuation;
              markedResult += wordOnly + `<span class="punctuation-error">${errorPunctuation}</span>`;
            } else if (!punctuation && Math.random() > 0.5) {
              // Add random punctuation where there was none
              const randomPunct = [",", ".", ";", ":"][Math.floor(Math.random() * 4)];
              
              plainResult += wordOnly + randomPunct;
              markedResult += wordOnly + `<span class="punctuation-error">${randomPunct}</span>`;
            } else {
              plainResult += word;
              markedResult += word;
            }
            break;
            
          case 2: // Word removal
            plainResult += "";
            markedResult += `<span class="missing-text">&lt;Missing Text&gt;</span>`;
            break;
            
          default:
            plainResult += word;
            markedResult += word;
        }
      });
    }
  });

  // Random chance to remove entire sentences (only if corruption is high)
  if (corruptionPercentage > 50) {
    const sentences = plainResult.split(/(?<=[.!?])\s+/);
    
    if (sentences.length > 2) {
      const sentenceToRemove = 1 + Math.floor(Math.random() * (sentences.length - 1));
      
      // Create versions with a sentence removed
      plainResult = sentences.filter((_, i) => i !== sentenceToRemove).join(" ");
      
      // In marked version, replace the sentence with a missing indicator
      markedResult = sentences.map((sentence, i) => 
        i === sentenceToRemove 
          ? `<span class="missing-text">&lt;Missing Sentence&gt;</span> `
          : sentence + " "
      ).join("");
    }
  }

  return { plainVersion: plainResult, markedVersion: markedResult };
};
