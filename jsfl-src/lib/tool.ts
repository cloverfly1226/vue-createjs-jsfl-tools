/// <reference types="@types/jsfl"/>

type PublishConfig = {
  /** 文件名(去除扩展名) */
  dom_name: string;

  /** 项目路径 */
  proj_folder: string;

  /** JS发布根目录 */
  publish_js_folder: string;

  /** JS发布地址 */
  publish_js_url: string;

  /** 图片发布根目录 */
  publish_image_folder: string;

  /** 图片发布目录 */
  publish_image_url: string;
};

function createPublishConfig(dom: FlashDocument): PublishConfig {
  const dom_name: string = dom.name.replace(/\.fla$/i, "");

  const proj_folder: string = dom.pathURI.replace(`/anims/${dom.name}`, "");

  const publish_js_folder: string = `${proj_folder}/src/assets/anims`;

  const publish_js_url: string = `${publish_js_folder}/${dom_name}.js`;

  const publish_image_folder: string = `${proj_folder}/src/assets/images`;

  const publish_image_url: string = `${publish_image_folder}/${dom_name}`;

  return {
    dom_name,
    proj_folder,
    publish_js_folder,
    publish_js_url,
    publish_image_folder,
    publish_image_url,
  };
}
