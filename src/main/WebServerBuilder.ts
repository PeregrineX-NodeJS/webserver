import { promises as fs } from "fs"
import http2 from "http2"
import { WebServer } from "./WebServer"

type CertificateType = string | Buffer | fs.FileHandle

function isFileHandle(cert: CertificateType | null): cert is fs.FileHandle {
    return cert !== null && typeof cert !== "string" && "readFile" in cert
}

export class WebServerBuilder {
    protected cert: CertificateType | null = null
    protected key: CertificateType | null = null

    public developmentMessagesEnabled: boolean = false

    enableDevelopmentMessages(): this {
        this.developmentMessagesEnabled = true
        return this
    }

    getCert(): CertificateType | null {
        return this.cert
    }

    setCert(cert: CertificateType): this {
        this.cert = cert
        return this
    }

    getKey(): CertificateType | null {
        return this.key
    }

    setKey(key: CertificateType): this {
        this.key = key
        return this
    }

    async build(): Promise<WebServer> {
        let cert: string | Buffer | null = null
        let key: string | Buffer | null = null

        if (isFileHandle(this.cert)) {
            cert = await this.cert.readFile()
            await this.cert.close()
        } else {
            cert = this.cert
        }

        if (isFileHandle(this.key)) {
            key = await this.key.readFile()
            await this.key.close()
        } else {
            key = this.key
        }

        if (cert === null && key === null) {
            console.warn("Creating server without TLS")
            return new WebServer(http2.createServer(), this.developmentMessagesEnabled)
        } else if (cert !== null && key !== null) {
            return new WebServer(http2.createSecureServer({ allowHTTP1: true, cert, key }), this.developmentMessagesEnabled)
        } else {
            throw new Error("Key and cert must be both set or unset")
        }
    }
}
