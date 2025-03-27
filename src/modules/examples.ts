import { config } from "../../package.json";
import { getLocaleID, getString } from "../utils/locale";
import { getPref } from "../utils/prefs";

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
        // Optional
        l10nArgs: `{"status": "Initialized"}`,
        // Can also have a optional dark icon 
        icon: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
      },
      sidenav: {
        l10nID: getLocaleID("item-section-example2-sidenav-tooltip"),
        icon: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
      },
      // Optional
      bodyXHTML: '<html:div style="display: flex;flex-direction: column;"><html:div style="display: flex;flex-direction: row;"><html:button id="clear_btn" style="font-size:18px;width:80px;height:40px;" >Clear</html:button><html:button id="add_title_btn" style="font-size:18px;width:80px;height:40px;" >+Title</html:button><html:button id="add_abs_btn" style="font-size:18px;width:80px;height:40px;" >+Abs</html:button><html:button id="getBib" style="font-size:18px;width:80px;height:40px;" >getBib</html:button></html:div><html:textarea id="uquery" cols="24" rows="8" style="font-size:18px;with:85%;" placeholder="user query"> </html:textarea><html:div style="display: flex;flex-direction: row;"><html:button id="uquery_btn" style="font-size:16px;width:80px;height:40px;" >Ask</html:button><html:button id="translate_btn" style="font-size:16px;width:100px;height:40px;" >translate</html:button><html:button id="summarize_btn" style="font-size:16px;width:100px;height:40px;" >Summarize</html:button></html:div><html:textarea id="result" cols="24" rows="28" style="font-size:18px;with:85%;" placeholder="result"> </html:textarea></html:div>',
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


        const uquery = body.querySelector("#uquery") as HTMLTextAreaElement;


        const uquery_btn = body.querySelector("#uquery_btn") as HTMLElement;

        const translate_btn = body.querySelector("#translate_btn") as HTMLElement;

        const summarize_btn = body.querySelector("#summarize_btn") as HTMLElement;

        const add_title_btn = body.querySelector("#add_title_btn") as HTMLElement;
        const add_abs_btn = body.querySelector("#add_abs_btn") as HTMLElement;
        const clear_btn = body.querySelector("#clear_btn") as HTMLElement;
        const getBib = body.querySelector("#getBib") as HTMLElement;
        const result_p = body.querySelector("#result") as HTMLElement;




        function add_title() {
          uquery.value += 'title:' + item.getField("title") + '\n\n';
        }
        function add_abs() {
          uquery.value += 'Abstract:' + item.getField("abstractNote") as string + '\n\n';
        }
        function clear_content() {
          uquery.value = '';
        }

        add_title_btn.addEventListener('click', add_title);
        add_abs_btn.addEventListener('click', add_abs);
        clear_btn.addEventListener('click', clear_content);

        async function getbib() {
          var qq = item.getField("title");
          if (uquery.value)
            qq = uquery.value

          var url = 'https://dblp.uni-trier.de/search/publ/api?q=' + qq + '&format=bib'
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          } else {

            var data = await response.text();
            result_p.textContent = '' + data;

          }


        }
        getBib.addEventListener('click', getbib);

        var system_prompt = 'you are research assistant.';


        async function ask_question() {

          uquery_btn.textContent = '...';
          system_prompt = 'you are research assistant.';
          user_query();

        }
        async function translate() {

          translate_btn.textContent = '...';
          system_prompt = 'you are research assistant, translate the content into Chinese.';
          user_query();
        }

        const OPENAI_API_KEY = getPref('input') as string;
        const apiUrl = getPref('base') as string;
        const model = getPref('model') as string;

        async function user_query() {

          // uquery.textContent += ''+apiUrl;`${uquery.textContent}`



          if (!OPENAI_API_KEY || !apiUrl) {
            result_p.textContent += 'API key or base URL is null, please set them in settings.';
          }



          var user_qtxt = uquery.value;


          var requestData = {
            model: `${model}`,
            messages: [{ role: 'system', content: `${system_prompt}` }, { role: 'user', content: `${user_qtxt}` }],
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
              result_p.textContent = '';
              // var data = await response.text;
              // ztoolkit.log("value:", data);
              // if(apikey.textContent)
              //   result_p.textContent+=apikey.textContent;
              // result_p.textContent+= JSON.parse(JSON.stringify(data)).choices[0].message.content;
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
                        result_p.textContent += text;
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

          uquery_btn.textContent = 'Ask';
          translate_btn.textContent = 'translate';





        }

        // 添加点击事件监听器
        uquery_btn.addEventListener('click', ask_question);

        translate_btn.addEventListener('click', translate);

        async function summarizePdf() {
          summarize_btn.textContent = '...';
          result_p.textContent = 'Fetching PDF and generating summary...';
          let pdfPath_content = null;
          try {
            // Get the current item's PDF attachment
            const attachments = await item.getAttachments();

            let pdfAttachment = null;

            for (const attachmentID of attachments) {
              const attachment = await Zotero.Items.getAsync(attachmentID);
              if (attachment.attachmentContentType === 'application/pdf') {
                pdfAttachment = attachment;
                pdfPath_content = await attachment.attachmentText;
                break;
              }
            }

            if (!pdfPath_content) {
              result_p.textContent = 'No PDF attachment found for this item.';
              summarize_btn.textContent = 'Summarize';
              return;
            }

            // Read the PDF file as binary data
            const fileContents = pdfPath_content;

            if (!fileContents) {
              throw new Error("Failed to read PDF file");
            }

            system_prompt = "please summarize the paper, including research problem, contribuition, methodology, future work. output must be in chinese.";

            var requestData = {
              model: `${model}`,
              messages: [{ role: 'system', content: `${system_prompt}` }, { role: 'user', content: `paper pdf text:\n\n${fileContents}` }],
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
                result_p.textContent = '';

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
                          result_p.textContent += text;
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

          } catch (error) {
            ztoolkit.log("Error in PDF summarization:", error);
            // Safely handle error message extraction
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else if (error && typeof error === 'object') {
              errorMessage = String(error);
            }
            result_p.textContent = `Error generating summary`;
          }

          summarize_btn.textContent = 'Summarize';
        }

        // Add event listener for summarize button
        summarize_btn.addEventListener('click', summarizePdf);

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
    for (var i in items) {

      var url = 'https://dblp.uni-trier.de/search/publ/api?q=' + items[i].getField("title") + '&format=bib'
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      } else {

        var data = await response.text();
        pTitle += '' + items[i].getField("title") + '\n\n';
        pTitleH += '' + data + '<br>';

      }

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
    const dialogHelper = new ztoolkit.Dialog(2, 1)
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
