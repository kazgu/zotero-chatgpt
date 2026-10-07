import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";

/**
 * Optimized Literature Review Dialog
 * This replaces the old dialogExample function with a better UI and streaming support
 */
export async function showReviewDialog(ztoolkit: any, addon: any) {
  const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();

  if (items.length === 0) {
    ztoolkit.getGlobal("alert")("Please select at least one paper");
    return;
  }

  // Collect paper information
  let papersList = '';
  let papersDisplay = '';
  let bibtexEntries = '';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.getField("title") as string;
    const abstract = item.getField("abstractNote") as string;
    const authors = item.getCreators();
    const authorNames = authors.map((a: any) => `${a.firstName} ${a.lastName}`).join(', ');
    const year = item.getField("date") as string;

    papersDisplay += `${i + 1}. ${title}\n`;
    papersList += `Paper ${i + 1}:\ntitle: ${title}\nauthors: ${authorNames}\nyear: ${year}\nabstract: ${abstract}\n\n`;

    // Generate BibTeX entry
    const firstAuthor = authors.length > 0 ? authors[0].lastName.toLowerCase() : 'unknown';
    const yearShort = year ? year.substring(0, 4) : 'n.d.';
    const citeKey = `${firstAuthor}${yearShort}`;

    // Format authors for BibTeX
    const bibtexAuthors = authors.map((a: any) => `${a.lastName}, ${a.firstName}`).join(' and ');

    // Get publication info
    const publicationType = item.itemType;
    const venue = item.getField("publicationTitle") as string || item.getField("conferenceName") as string || '';

    bibtexEntries += `@${publicationType === 'conferencePaper' ? 'inproceedings' : 'article'}{${citeKey},\n`;
    bibtexEntries += `  title={${title}},\n`;
    bibtexEntries += `  author={${bibtexAuthors}},\n`;
    bibtexEntries += `  year={${yearShort}},\n`;
    if (venue) {
      bibtexEntries += `  ${publicationType === 'conferencePaper' ? 'booktitle' : 'journal'}={${venue}},\n`;
    }
    bibtexEntries += `}\n\n`;
  }

  // Get API credentials
  const OPENAI_API_KEY = getPref('input') as string;
  const apiUrl = getPref('base') as string;
  const model = getPref('model') as string;

  if (!OPENAI_API_KEY || !apiUrl) {
    ztoolkit.getGlobal("alert")(getString("chat-error-no-api-key"));
    return;
  }

  // Create dialog
  const dialogData: { [key: string | number]: any } = {
    loadCallback: () => {
      ztoolkit.log("Review dialog opened");
    },
    unloadCallback: () => {
      ztoolkit.log("Review dialog closed");
    },
  };

  const dialogHelper = new ztoolkit.Dialog(5, 1)
    .addCell(0, 0, {
      tag: "h2",
      properties: {
        innerHTML: "Generate Literature Review",
      },
      styles: {
        margin: "0 0 16px 0",
        fontSize: "18px",
        fontWeight: "bold",
      },
    })
    .addCell(1, 0, {
      tag: "div",
      children: [
        {
          tag: "label",
          properties: {
            innerHTML: `Selected Papers (${items.length}):`,
          },
          styles: {
            display: "block",
            marginBottom: "8px",
            fontWeight: "bold",
            fontSize: "14px",
          },
        },
        {
          tag: "textarea",
          id: "papers-list",
          properties: {
            value: papersDisplay,
            readOnly: true,
          },
          styles: {
            width: "100%",
            height: "120px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "inherit",
            resize: "none",
            backgroundColor: "#f5f5f5",
            boxSizing: "border-box",
          },
        },
      ],
    })
    .addCell(2, 0, {
      tag: "div",
      children: [
        {
          tag: "label",
          properties: {
            innerHTML: "Review Topic:",
          },
          styles: {
            display: "block",
            marginBottom: "8px",
            marginTop: "16px",
            fontWeight: "bold",
            fontSize: "14px",
          },
        },
        {
          tag: "input",
          id: "topic-input",
          attributes: {
            type: "text",
            placeholder: "e.g., Large Language Models, Computer Vision, etc.",
          },
          styles: {
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "inherit",
            boxSizing: "border-box",
          },
        },
      ],
    })
    .addCell(3, 0, {
      tag: "div",
      children: [
        {
          tag: "label",
          properties: {
            innerHTML: "Generated Review:",
          },
          styles: {
            display: "block",
            marginBottom: "8px",
            marginTop: "16px",
            fontWeight: "bold",
            fontSize: "14px",
          },
        },
        {
          tag: "textarea",
          id: "review-output",
          properties: {
            placeholder: "Click 'Generate' to create the review...",
          },
          styles: {
            width: "100%",
            height: "300px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "13px",
            fontFamily: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
          },
        },
      ],
    })
    .addCell(4, 0, {
      tag: "div",
      styles: {
        display: "flex",
        gap: "8px",
        marginTop: "16px",
        justifyContent: "flex-end",
      },
      children: [
        {
          tag: "button",
          id: "generate-btn",
          namespace: "html",
          attributes: {
            type: "button",
          },
          properties: {
            innerHTML: "Generate",
          },
          styles: {
            padding: "11px 20px",
            backgroundColor: "#0084ff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          },
        },
        {
          tag: "button",
          id: "copy-btn",
          namespace: "html",
          attributes: {
            type: "button",
          },
          properties: {
            innerHTML: "Copy",
          },
          styles: {
            padding: "11px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          },
        },
      ],
    })
    .setDialogData(dialogData)
    .open("Literature Review Generator", {
      width: 700,
      height: 700,
      centerscreen: true,
      resizable: true,
    });

  // Wait for dialog to be fully rendered
  await new Promise(resolve => setTimeout(resolve, 100));

  // Get dialog elements
  const dialogWindow = dialogHelper.window;
  if (!dialogWindow) {
    ztoolkit.log("Error: dialogWindow is null");
    return;
  }

  const topicInput = dialogWindow.document.getElementById("topic-input") as HTMLInputElement;
  const reviewOutput = dialogWindow.document.getElementById("review-output") as HTMLTextAreaElement;
  const generateBtn = dialogWindow.document.getElementById("generate-btn") as HTMLButtonElement;
  const copyBtn = dialogWindow.document.getElementById("copy-btn") as HTMLButtonElement;

  if (!topicInput || !reviewOutput || !generateBtn || !copyBtn) {
    ztoolkit.log("Error: Some dialog elements not found", {
      topicInput: !!topicInput,
      reviewOutput: !!reviewOutput,
      generateBtn: !!generateBtn,
      copyBtn: !!copyBtn
    });
    return;
  }

  ztoolkit.log("Dialog elements found successfully");

  // Generate button handler
  generateBtn.addEventListener("click", async () => {
    ztoolkit.log("Generate button clicked");
    const topic = topicInput.value.trim();
    ztoolkit.log("Topic:", topic);

    if (!topic) {
      ztoolkit.getGlobal("alert")("Please enter a review topic");
      return;
    }

    // Disable button and show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = "Generating...";
    reviewOutput.value = "";

    try {
      const systemPrompt = `You are a computer science researcher. Based on the provided literature, write a comprehensive related work section about ${topic}. Instead of simply listing papers, identify and discuss the common ground and key differences between studies.

Writing Requirements:

1. Maintain a balanced style: 60% formal academic tone, 40% conversational clarity.
2. Use clear subjects in each sentence and prefer short, crisp sentence structures over long, complex ones.
3. Synthesize the literature into a natural, compact paragraph format.
4. Include proper LaTeX citations (e.g., \\cite{author2023}) at appropriate locations within the text.

Focus on creating a cohesive narrative that demonstrates how the field has evolved and where current gaps or disagreements exist.`;

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'literatures:\n' + papersList }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let reviewText = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (let line of lines) {
          try {
            line = line.replace(/^data:\s*/, '');
            if (line === '[DONE]') continue;

            const data = JSON.parse(line);
            const content = data.choices?.[0]?.delta?.content || '';

            if (content) {
              reviewText += content;
              reviewOutput.value = reviewText;
              // Auto-scroll to bottom
              reviewOutput.scrollTop = reviewOutput.scrollHeight;
            }
          } catch (error) {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }

      // Append BibTeX entries after review is complete
      if (reviewText && bibtexEntries) {
        reviewText += '\n\n---\n\nReferences (BibTeX):\n\n' + bibtexEntries;
        reviewOutput.value = reviewText;
        reviewOutput.scrollTop = reviewOutput.scrollHeight;
      }

      generateBtn.innerHTML = "Generate";
      generateBtn.disabled = false;

    } catch (error) {
      ztoolkit.log("Error generating review:", error);
      reviewOutput.value = `Error: ${error}`;
      generateBtn.innerHTML = "Generate";
      generateBtn.disabled = false;
    }
  });

  // Copy button handler
  copyBtn.addEventListener("click", () => {
    const reviewText = reviewOutput.value;

    if (!reviewText) {
      ztoolkit.getGlobal("alert")("Nothing to copy");
      return;
    }

    new ztoolkit.Clipboard()
      .addText(reviewText, "text/unicode")
      .copy();

    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = "Copied!";
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });

  addon.data.dialog = dialogHelper;
  await dialogData.unloadLock.promise;
  addon.data.dialog = undefined;
}
