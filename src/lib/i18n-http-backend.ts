const DEFAULT_LOAD_PATH = "/api/translations/{{lng}}/{{ns}}";

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
};

type BackendOptions = {
  loadPath?: string;
  requestOptions?: RequestOptions | ((languages: string[], namespaces: string[]) => RequestOptions);
  queryStringParams?: Record<string, string> | ((languages: string[], namespaces: string[]) => Record<string, string>);
};

type ReadCallback = (error: any, data?: any) => void;

type Services = {
  interpolator?: {
    interpolate: (str: string, data: Record<string, unknown>, fmt: string, lng: string) => string;
  };
};

export default class HttpBackend {
  type = "backend" as const;
  services: Services | null = null;
  options: BackendOptions = {};

  constructor(services?: Services, options?: BackendOptions) {
    if (services) this.services = services;
    if (options) this.options = { ...options };
  }

  init(services: Services, backendOptions: BackendOptions = {}) {
    this.services = services;
    this.options = { ...backendOptions };
  }

  private resolveLoadPath(lng: string, ns: string) {
    const pattern = this.options.loadPath || DEFAULT_LOAD_PATH;
    const loadPath = pattern
      .replace("{{lng}}", lng)
      .replace("{{ns}}", ns);
    if (this.services?.interpolator) {
      return this.services.interpolator.interpolate(loadPath, { lng, ns }, "", lng);
    }
    return loadPath;
  }

  private buildQuery(lng: string[], ns: string[]) {
    const params =
      typeof this.options.queryStringParams === "function"
        ? this.options.queryStringParams(lng, ns)
        : this.options.queryStringParams;
    if (!params) return "";
    const usp = new URLSearchParams(params).toString();
    return usp ? `?${usp}` : "";
  }

  read(language: string, namespace: string, callback: ReadCallback) {
    const url = `${this.resolveLoadPath(language, namespace)}${this.buildQuery([language], [namespace])}`;

    const requestOptions =
      typeof this.options.requestOptions === "function"
        ? this.options.requestOptions([language], [namespace])
        : this.options.requestOptions;

    fetch(url, {
      credentials: "same-origin",
      ...requestOptions,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed loading ${url}: ${response.status}`);
        }
        const data = await response.json();
        callback(null, data);
      })
      .catch((error) => {
        callback(error);
      });
  }
}
