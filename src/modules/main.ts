import { config } from "../../package.json";
import { getLocaleID, getString } from "../utils/locale";
import { getPref } from "../utils/prefs";

// Chat session types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ChatSession {
  messages: ChatMessage[];
  pdfAttached: boolean;
  pdfContent?: string;
}

// Global chat sessions manager using WeakMap
const chatSessions = new WeakMap<Zotero.Item, ChatSession>();

// Helper function to get or create chat session
function getChatSession(item: Zotero.Item): ChatSession {
  if (!chatSessions.has(item)) {
    chatSessions.set(item, {
      messages: [],
      pdfAttached: false,
      pdfContent: undefined
    });
  }
  return chatSessions.get(item)!;
}

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    Zotero.Plugins.addObserver({
      shutdown: ({ id: pluginID }) => {
        this.unregisterNotifier(notifierID);
      },
    });
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    Zotero.PreferencePanes.register({
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
    });
  }
}

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    // Register an event key for Alt+L
    ztoolkit.Keyboard.register((ev, keyOptions) => {
      ztoolkit.log(ev, keyOptions.keyboard);
      if (keyOptions.keyboard?.equals("shift,l")) {
        addon.hooks.onShortcuts("larger");
      }
      if (ev.shiftKey && ev.key === "S") {
        addon.hooks.onShortcuts("smaller");
      }
    });

    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Example Shortcuts: Alt+L/S/C",
        type: "success",
      })
      .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutSmallerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Smaller!",
        type: "default",
      })
      .show();
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet(win: Window) {
    const doc = win.document;
    const styles = ztoolkit.UI.createElement(doc, "link", {
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/zoteroPane.css`,
      },
    });
    doc.documentElement.appendChild(styles);
    // doc.getElementById("zotero-item-pane-content")?.classList.add("makeItRed");
  }

  @example
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;

    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: getString("menuitem-label"),
      commandListener: (ev) => addon.hooks.onDialogEvents("dialogExample"),
      icon: menuIcon,
    });
  }



  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ztoolkit.Menu.register("menuFile", {
      tag: "menuitem",
      label: getString("menuitem-filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  @example
  static async registerExtraColumn() {
    const field = "test1";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "text column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      iconPath: "chrome://zotero/skin/cross.png",
    });
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    const field = "test2";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "custom column",
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return field + String(item.id);
      },
      renderCell(index, data, column) {
        ztoolkit.log("Custom column cell is rendered!");
        const span = Zotero.getMainWindow().document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "span",
        );
        span.className = `cell ${column.className}`;
        span.style.background = "#0dd068";
        span.innerText = "⭐" + data;
        return span;
      },
    });
  }

  @example
  static registerItemPaneSection() {
    Zotero.ItemPaneManager.registerSection({
      paneID: "example",
      pluginID: config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example1-head-text"),
        icon: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
      },
      bodyXHTML: '<html:div style="display: flex;flex-direction: column;"><html:div style="display: flex;flex-direction: row;"><html:button id="clear_btn" style="font-size:18px;width:80px;height:40px;" >Clear</html:button><html:button id="add_title_btn" style="font-size:18px;width:80px;height:40px;" >+Title</html:button><html:button id="add_abs_btn" style="font-size:18px;width:80px;height:40px;" >+Abs</html:button><html:button id="getBib" style="font-size:18px;width:80px;height:40px;" >getBib</html:button></html:div><html:textarea id="uquery" cols="24" rows="10" style="font-size:18px;with:85%;" placeholder="user query"> </html:textarea><html:button id="uquery_btn" style="font-size:16px;width:80px;height:40px;" >Ask</html:button><html:button id="translate_btn" style="font-size:16px;width:80px;height:40px;" >translate</html:button><html:textarea id="result" cols="24" rows="24" style="font-size:18px;with:85%;" placeholder="result"> </html:textarea></html:div>',
      sidenav: {
        l10nID: getLocaleID("item-section-example1-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
      },
      onRender: ({ body, item, editable, tabType }) => {





      },
    });
  }

  @example
  static async registerReaderItemPaneSection(win: Window) {
    const doc = win.document;
    Zotero.ItemPaneManager.registerSection({
      paneID: "reader-example",
      pluginID: config.addonID,
      header: {
        l10nID: getLocaleID("item-section-example2-head-text"),
        icon: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
      },
      bodyXHTML: `
        <html:div style="display:block;max-height:1000px;height:100%;overflow:hidden;background:#f7f7f8;">
          <html:div id="chat-history" style="height:calc(100% - 120px);max-height:800px;overflow-y:auto;overflow-x:hidden;padding:12px;background:#f7f7f8;">
            <html:div id="empty-state" style="text-align:center;padding:40px 20px;color:#999;font-size:14px;">
              <html:div style="font-size:36px;margin-bottom:8px;">💬</html:div>
              <html:div data-l10n-id="${getLocaleID("chat-empty-state")}">Start a conversation with ChatGPT</html:div>
            </html:div>
          </html:div>
          <html:div style="padding:8px 12px;background:#fff;border-top:1px solid #ddd;">
            <html:label style="display:block;margin-bottom:8px;font-size:13px;color:#444;">
              <html:input type="checkbox" id="attach-pdf" style="margin-right:6px;" />
              <html:span data-l10n-id="${getLocaleID("chat-attach-pdf-label")}">附加 PDF 内容</html:span>
              <html:span id="pdf-status" style="margin-left:8px;font-size:12px;color:#666;"></html:span>
            </html:label>
          </html:div>
          <html:div style="padding:8px 12px;background:#fff;border-top:1px solid #ddd;">
            <html:div style="position:relative;">
              <html:textarea
                id="message-input"
                rows="2"
                placeholder="Start a new message..."
                style="width:100%;padding:8px 60px 8px 12px;border:1px solid #ccc;border-radius:4px;font-size:14px;font-family:inherit;resize:none;box-sizing:border-box;"
              ></html:textarea>
              <html:button
                id="send-button"
                data-l10n-attr="title"
                data-l10n-id="${getLocaleID("chat-send-button-tooltip")}"
                style="position:absolute;right:4px;bottom:4px;padding:4px 10px;background:#0084ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;"
              >Send</html:button>
            </html:div>
          </html:div>
        </html:div>
      `,
      // Optional, Called when the section is first created, must be synchronous
      onInit: ({ item }) => {
        ztoolkit.log("Section init!", item?.id);
      },
      // Optional, Called when the section is destroyed, must be synchronous
      onDestroy: (props) => {
        ztoolkit.log("Section destroy!");
      },
      // Optional, Called when the section data changes (setting item/mode/tabType/inTrash), must be synchronous. return false to cancel the change
      onItemChange: ({ item, setEnabled, tabType }) => {
        ztoolkit.log(`Section item data changed to ${item?.id}`);
        setEnabled(tabType === "reader");
        return true;
      },

      onRender: ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {

      },

      onAsyncRender: async ({
        body,
        item,
        setL10nArgs,
        setSectionSummary,
        setSectionButtonStatus,
      }) => {
        // Get DOM elements
        const chatHistory = body.querySelector("#chat-history") as HTMLElement;
        const messageInput = body.querySelector("#message-input") as HTMLTextAreaElement;
        const sendButton = body.querySelector("#send-button") as HTMLButtonElement;
        const attachPdfCheckbox = body.querySelector("#attach-pdf") as HTMLInputElement;
        const pdfStatus = body.querySelector("#pdf-status") as HTMLElement;

        // Get API credentials
        const OPENAI_API_KEY = getPref('input') as string;
        const apiUrl = getPref('base') as string;
        const model = getPref('model') as string;

        // Get or create chat session for this item
        const session = getChatSession(item);

        // Check if PDF is available
        const hasPdf = await checkPdfAvailability(item);
        if (!hasPdf) {
          attachPdfCheckbox.disabled = true;
          pdfStatus.textContent = getString("chat-attach-pdf-no-pdf");
          pdfStatus.className = "pdf-status";
        } else if (session.pdfAttached) {
          pdfStatus.textContent = `✓ ${getString("chat-attach-pdf-attached")}`;
          pdfStatus.className = "pdf-status attached";
        }

        // Helper: Check PDF availability
        async function checkPdfAvailability(item: Zotero.Item): Promise<boolean> {
          try {
            const attachments = await item.getAttachments();
            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === 'application/pdf') {
                return true;
              }
            }
            return false;
          } catch (error) {
            return false;
          }
        }

        // Helper: Get PDF content
        async function getPdfContent(item: Zotero.Item): Promise<string | null> {
          try {
            const attachments = await item.getAttachments();
            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === 'application/pdf') {
                return await attachment.attachmentText;
              }
            }
            return null;
          } catch (error) {
            ztoolkit.log("Error getting PDF content:", error);
            return null;
          }
        }

        // Helper: Render user message
        function renderUserMessage(content: string) {
          // Remove empty state if exists
          const emptyState = chatHistory.querySelector('#empty-state');
          if (emptyState) {
            emptyState.remove();
          }

          const wrapper = body.ownerDocument.createElement('div');
          wrapper.setAttribute('style', 'display:block;margin:8px 0;text-align:right;');

          const bubble = body.ownerDocument.createElement('div');
          bubble.setAttribute('style', 'display:inline-block;max-width:70%;overflow-y:auto;overflow-x:auto;background:#0084ff;color:#fff;padding:10px 14px;border-radius:12px;text-align:left;word-wrap:break-word;white-space:pre-wrap;');

          bubble.textContent = content;
          wrapper.appendChild(bubble);
          chatHistory.appendChild(wrapper);

          scrollToBottom();
        }

        // Helper: Create AI message element
        function createAssistantMessageElement(): { content: HTMLElement, copyBtn: HTMLElement } {
          const wrapper = body.ownerDocument.createElement('div');
          wrapper.setAttribute('style', 'display:block;margin:8px 0;text-align:left;');

          const bubble = body.ownerDocument.createElement('div');
          bubble.setAttribute('style', 'position:relative;display:inline-block;max-width:70%;overflow-y:auto;overflow-x:auto;background:#e4e6eb;color:#333;padding:10px 14px 10px 14px;border-radius:12px;word-wrap:break-word;white-space:pre-wrap;');

          const content = body.ownerDocument.createElement('div');
          content.setAttribute('style', 'padding-right:30px;');

          const copyBtn = body.ownerDocument.createElement('button');
          copyBtn.textContent = '📋';
          copyBtn.setAttribute('title', 'Copy');
          copyBtn.setAttribute('style', 'display:none;position:absolute;right:4px;bottom:4px;background:rgba(255,255,255,0.8);border:1px solid #ccc;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:14px;opacity:0.6;transition:opacity 0.2s;');

          copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
          });

          copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0.6';
          });

          copyBtn.addEventListener('click', () => {
            const textContent = content.textContent || '';
            try {
              // Use Zotero toolkit clipboard
              new ztoolkit.Clipboard()
                .addText(textContent, "text/unicode")
                .copy();
              copyBtn.textContent = '✓';
              setTimeout(() => {
                copyBtn.textContent = '📋';
              }, 2000);
            } catch (error) {
              ztoolkit.log("Copy failed:", error);
              copyBtn.textContent = '✗';
              setTimeout(() => {
                copyBtn.textContent = '📋';
              }, 2000);
            }
          });

          bubble.appendChild(content);
          bubble.appendChild(copyBtn);
          wrapper.appendChild(bubble);
          chatHistory.appendChild(wrapper);

          scrollToBottom();
          return { content, copyBtn };
        }

        // Helper: Simple markdown to HTML converter
        function markdownToHtml(markdown: string): string {
          let html = markdown;

          // Code blocks (```language\ncode\n```)
          html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre style="background:#2d2d2d;color:#f8f8f2;padding:12px;border-radius:6px;overflow-x:auto;margin:8px 0;"><code>${escapeHtml(code.trim())}</code></pre>`;
          });

          // Inline code (`code`)
          html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-family:monospace;color:#e83e8c;">$1</code>');

          // Bold (**text** or __text__)
          html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

          // Italic (*text* or _text_)
          html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
          html = html.replace(/_(.+?)_/g, '<em>$1</em>');

          // Headers
          html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:bold;margin:12px 0 8px 0;">$1</h3>');
          html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:bold;margin:14px 0 10px 0;">$1</h2>');
          html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:bold;margin:16px 0 12px 0;">$1</h1>');

          // Lists (- item)
          html = html.replace(/^- (.+)$/gm, '<li style="margin-left:20px;">$1</li>');
          html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:8px 0;padding-left:20px;">$&</ul>');

          // Numbered lists (1. item)
          html = html.replace(/^\d+\.\s(.+)$/gm, '<li style="margin-left:20px;">$1</li>');

          // Links [text](url)
          html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#0084ff;text-decoration:underline;" target="_blank">$1</a>');

          // Line breaks
          html = html.replace(/\n/g, '<br/>');

          return html;
        }

        // Helper: Escape HTML
        function escapeHtml(text: string): string {
          const div = body.ownerDocument.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        // Helper: Update message content with markdown rendering
        function updateMessageContent(messageObj: { content: HTMLElement, copyBtn: HTMLElement }, content: string) {
          messageObj.content.innerHTML = markdownToHtml(content);
          scrollToBottom();
        }

        // Helper: Show copy button
        function showCopyButton(copyBtn: HTMLElement) {
          copyBtn.style.display = 'block';
        }

        // Helper: Scroll to bottom
        function scrollToBottom() {
          chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        // Helper: Show error message
        function showError(message: string) {
          const wrapper = body.ownerDocument.createElement('div');
          wrapper.setAttribute('style', 'display:block;margin:8px 0;text-align:center;');

          const bubble = body.ownerDocument.createElement('div');
          bubble.setAttribute('style', 'display:inline-block;background:#ff4444;color:#fff;padding:8px 12px;border-radius:6px;font-size:13px;');
          bubble.textContent = `⚠️ ${message}`;

          wrapper.appendChild(bubble);
          chatHistory.appendChild(wrapper);

          scrollToBottom();
        }

        // Main: Send message function
        async function sendMessage() {
          const userMessage = messageInput.value.trim();
          if (!userMessage) return;

          // Validate API settings
          if (!OPENAI_API_KEY || !apiUrl) {
            showError(getString("chat-error-no-api-key"));
            return;
          }

          // Disable inputs
          sendButton.disabled = true;
          messageInput.disabled = true;
          const originalButtonText = sendButton.innerHTML;
          sendButton.innerHTML = '<span>...</span>';

          try {
            // Render user message
            renderUserMessage(userMessage);

            // Prepare message content
            let finalContent = userMessage;

            // Handle PDF attachment
            if (attachPdfCheckbox.checked && !session.pdfAttached) {
              if (!session.pdfContent) {
                const pdfContent = await getPdfContent(item);
                session.pdfContent = pdfContent || undefined;
              }
              if (session.pdfContent) {
                finalContent += "\n\nPDF Content:\n" + session.pdfContent;
                session.pdfAttached = true;
                pdfStatus.textContent = `✓ ${getString("chat-attach-pdf-attached")}`;
                pdfStatus.className = "pdf-status attached";
              } else {
                showError(getString("chat-error-no-pdf"));
              }
            }

            // Add user message to history
            session.messages.push({
              role: 'user',
              content: finalContent,
              timestamp: Date.now()
            });

            // Build API messages
            const systemPrompt = 'You are a research assistant.';
            const apiMessages = [
              { role: 'system', content: systemPrompt },
              ...session.messages.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            ];

            // Create AI message element
            const aiMessageObj = createAssistantMessageElement();
            let assistantContent = '';

            // Call API with streaming
            const response = await fetch(`${apiUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: model,
                messages: apiMessages,
                stream: true,
              }),
            });

            if (!response.ok) {
              throw new Error(`${response.status} ${response.statusText}`);
            }

            // Process streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

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
                    assistantContent += content;
                    updateMessageContent(aiMessageObj, assistantContent);
                  }
                } catch (error) {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }

            // Add assistant message to history
            if (assistantContent) {
              session.messages.push({
                role: 'assistant',
                content: assistantContent,
                timestamp: Date.now()
              });
              // Show copy button after completion
              showCopyButton(aiMessageObj.copyBtn);
            }

            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';

          } catch (error) {
            ztoolkit.log("Error sending message:", error);
            showError(getString("chat-error-api") + `: ${error}`);
          } finally {
            // Re-enable inputs
            sendButton.disabled = false;
            messageInput.disabled = false;
            sendButton.innerHTML = originalButtonText;
            messageInput.focus();
          }
        }

        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
          messageInput.style.height = 'auto';
          messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });

        // Send on Enter, new line on Shift+Enter
        messageInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
          }
        });

        // Send button click
        sendButton.addEventListener('click', sendMessage);

        // Restore chat history if exists
        if (session.messages.length > 0) {
          // Remove empty state
          const emptyState = chatHistory.querySelector('.chat-empty-state');
          if (emptyState) {
            emptyState.remove();
          }

          // Render existing messages (without PDF content in display)
          for (const msg of session.messages) {
            if (msg.role === 'user') {
              // Display user message without PDF content
              const displayContent = msg.content.split('\n\nPDF Content:\n')[0];
              renderUserMessage(displayContent);
            } else if (msg.role === 'assistant') {
              const aiMessageObj = createAssistantMessageElement();
              updateMessageContent(aiMessageObj, msg.content);
              showCopyButton(aiMessageObj.copyBtn);
            }
          }
        }
      },
      // Optional, Called when the section is toggled. Can happen anytime even if the section is not visible or not rendered
      onToggle: ({ item }) => {
        ztoolkit.log("Section toggled!", item?.id);
      },

    });
  }
}



export class HelperExampleFactory {
  @example
  static async dialogExample() {
    const items = ztoolkit.getGlobal("ZoteroPane").getSelectedItems();
    var pTitle = '';
    var pTitleH = '';
    var Review_text = '';
    var topic = '';

    for (var i in items) {
      if (items[i].getField("abstractNote") as string == 'Topic') {
        topic = items[i].getField("title") as string;
        continue;
      }


      var title = 'title: ' + items[i].getField("title") as string;
      var abstract = 'abstract: ' + items[i].getField("abstractNote") as string;
      var authors = items[i].getCreators();
      var authorss = [];
      for (var j in authors) {
        authorss.push(authors[j].firstName + ' ' + authors[j].lastName);
      }


      pTitleH += items[i].getField("title") as string + '\n';
      pTitle += 'Paper' + i + ':\n' + title + '\n' + 'authors:' + authorss.join() + '\n' + 'year:' + items[i].getField("date") as string + '\n' + abstract + '\n\n';

      // var url = 'https://dblp.uni-trier.de/search/publ/api?q=' + items[i].getField("title") + '&format=bib'
      // const response = await fetch(url);
      // if (!response.ok) {
      //   throw new Error('Network response was not ok');
      // } else {

      //   var data = await response.text();
      //   // pTitle += '' + items[i].getField("title") + '\n\n';
      //   pTitleH += '' + items[i].getField("title") + '<br>';
      //   pTitle+='' + data + '\n'+'\n'+abstract+'\n';

      // }



      // const attachments = await items[i].getAttachments();

      // let pdfAttachment = null;
      // let pdfPath_content = null;

      // for (const attachmentID of attachments) {
      //   const attachment = await Zotero.Items.getAsync(attachmentID);
      //   if (attachment.attachmentContentType === 'application/pdf') {
      //     pdfAttachment = attachment;
      //     pdfPath_content = await attachment.attachmentText;
      //     pTitleH=pdfPath_content.substring(0,100);
      //     break;
      //   }
      // }

    }

    const OPENAI_API_KEY = getPref('input') as string;
    const apiUrl = getPref('base') as string;
    const model = getPref('model') as string;



    if (!OPENAI_API_KEY || !apiUrl || !topic) {
      Review_text = 'API key or base URL is null,topic is empty, please set them in settings.';
    }



    // var user_qtxt = uquery.value;

    // if (ask_pdf.checked == true) {
    //   const attachments = await item.getAttachments();

    //   let pdfAttachment = null;
    //   let pdfPath_content = null;

    //   for (const attachmentID of attachments) {
    //     const attachment = await Zotero.Items.getAsync(attachmentID);
    //     if (attachment.attachmentContentType === 'application/pdf') {
    //       pdfAttachment = attachment;
    //       pdfPath_content = await attachment.attachmentText;
    //       break;
    //     }
    //   }

    //   if (!pdfPath_content) {
    //     result_p.textContent = 'No PDF attachment found for this item.';
    //     return;
    //   }
    //   user_qtxt += "\n\n paper pdf text:\n\n" + `${pdfPath_content}`;
    // }
    var system_prompt = `You are a computer science researcher. Based on the provided literature, write a comprehensive related work section about ${topic}. Instead of simply listing papers, identify and discuss the common ground and key differences between studies.

Writing Requirements:

1.Maintain a balanced style: 60% formal academic tone, 40% conversational clarity.
2.Use clear subjects in each sentence and prefer short, crisp sentence structures over long, complex ones.
3.Synthesize the literature into a natural, compact paragraph format.
4.Include proper LaTeX citations (e.g., \cite{author2023}) at appropriate locations within the text.

Focus on creating a cohesive narrative that demonstrates how the field has evolved and where current gaps or disagreements exist.`;


    var requestData = {
      model: `${model}`,
      messages: [{ role: 'system', content: `${system_prompt}` }, { role: 'user', content: 'literatures:\n' + `${pTitle}` }],
      stream: true,
      // max_tokens: 2000,
      // temperature: 0.7,
    };



    try {
      var response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      } else {

        const reader = response.body?.getReader();

        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader!.read();
          done = streamDone;
          if (value) {
            // 解析数据块

            const chunk = decoder.decode(value, { stream: true });
            // 处理每个数据块

            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (var line of lines) {
              try {
                line = line.replace('data:', '')
                // result_p.textContent+=line;
                const data = JSON.parse(line);
                if (data.choices && data.choices[0]) {
                  const text = data.choices[0].delta?.content || '';
                  // process.stdout.write(text); // 直接输出文本到控制台
                  Review_text += text;
                }
              } catch (error) {
                ztoolkit.log("Could not parse JSON:", line);
                // result_p.textContent+=error as string;
              }
            }
          }
        }
      }


    } catch (error) {
      ztoolkit.log("Error", error);
      throw error;
    }




    const dialogData: { [key: string | number]: any } = {
      inputValue: "test",
      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      },
    };
    const dialogHelper = new ztoolkit.Dialog(2, 2)
      .addCell(0, 0, {
        tag: "p",
        properties: {
          innerHTML:
            `${pTitleH}`,
        },
        styles: {
          width: "440px",
          fontSize: "12",
        },
      })
      .addCell(
        1,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                new ztoolkit.Clipboard()
                  .addText(
                    `${pTitle}`,
                    "text/unicode",
                  )
                  .copy();
                ztoolkit.getGlobal("alert")("Copied!");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "Copy",
              },
            },
          ],
        },
        false,
      )
      .addCell(
        1,
        1,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                new ztoolkit.Clipboard()
                  .addText(
                    `${Review_text}`,
                    "text/unicode",
                  )
                  .copy();
                ztoolkit.getGlobal("alert")("Copied!");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "Copy Review",
              },
            },
          ],
        },
        false,
      )
      .addButton("Cancel", "cancel")
      .setDialogData(dialogData)
      .open("Papers");

    addon.data.dialog = dialogHelper;
    await dialogData.unloadLock.promise;
    addon.data.dialog = undefined;

    ztoolkit.log(dialogData);
  }

  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
        "text/unicode",
      )
      .addText(
        '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
        "text/html",
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"],
      ],
      "image.png",
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
