/**
 * SOAP Version Service Tests
 * ============================================================
 * Target:   Apache Axis2 Version Service
 * WSDL:     http://216.10.245.166:8080/axis2/services/Version?wsdl
 * Protocol: SOAP 1.1 and SOAP 1.2 (both tested)
 *
 * What is SOAP?
 * -------------
 * SOAP (Simple Object Access Protocol) is an XML-based messaging protocol.
 * Unlike REST (which uses JSON over HTTP), SOAP wraps every request and
 * response in an XML "Envelope". Playwright has no built-in SOAP client,
 * so we send raw XML via request.post() and parse the XML response with
 * fast-xml-parser.
 *
 * SOAP 1.1 vs SOAP 1.2
 * --------------------
 * SOAP 1.1  → Content-Type: text/xml        | SOAPAction: header required
 * SOAP 1.2  → Content-Type: application/soap+xml | action= embedded in Content-Type
 *
 * Service details (from WSDL)
 * ---------------------------
 * Namespace:   http://axisversion.sample
 * Operation:   getVersion  (no input parameters)
 * Response:    <ns:return> string — e.g. "Hi - the Axis2 version is 1.6.2"
 * SOAP Action: urn:getVersion
 *
 * Endpoints
 * ---------
 * SOAP 1.1:  http://216.10.245.166:8080/axis2/services/Version.VersionHttpSoap11Endpoint/
 * SOAP 1.2:  http://216.10.245.166:8080/axis2/services/Version.VersionHttpSoap12Endpoint/
 *
 * Known Axis2 quirk
 * -----------------
 * When Axis2 receives a bad request (malformed XML, wrong Content-Type),
 * it sends a non-RFC-compliant HTTP response — the status line is missing
 * the required CR character. Playwright's HTTP parser throws a "Parse Error"
 * instead of returning a response object. Error-handling tests use try/catch
 * to handle both outcomes (status code OR thrown error).
 *
 * XML parsing
 * -----------
 * fast-xml-parser strips namespace prefixes (removeNSPrefix: true) so we
 * can access Envelope.Body.getVersionResponse.return without worrying about
 * the soapenv: or ns: prefix names.
 */

import { test, expect } from '../../src/fixtures/index.js';
import { XMLParser } from 'fast-xml-parser';

// ── Endpoints ──────────────────────────────────────────────────────────────
const SOAP11_ENDPOINT = 'http://216.10.245.166:8080/axis2/services/Version.VersionHttpSoap11Endpoint/';
const SOAP12_ENDPOINT = 'http://216.10.245.166:8080/axis2/services/Version.VersionHttpSoap12Endpoint/';

// Target XML namespace declared in the WSDL
const NS = 'http://axisversion.sample';

// ── XML parser setup ────────────────────────────────────────────────────────
// removeNSPrefix: true  → strips "soapenv:", "ns:" etc. so paths are clean
// ignoreAttributes: false → keeps XML attributes if needed later
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });

/**
 * Parses the SOAP response XML and extracts the version string.
 *
 * Expected XML structure (namespace prefixes stripped by parser):
 *   <Envelope>
 *     <Body>
 *       <getVersionResponse>
 *         <return>Hi - the Axis2 version is 1.6.2</return>
 *       </getVersionResponse>
 *     </Body>
 *   </Envelope>
 */
function extractVersion(xml: string): string {
  const doc = parser.parse(xml);
  return doc?.Envelope?.Body?.getVersionResponse?.return ?? '';
}

// ── SOAP Envelopes ──────────────────────────────────────────────────────────

/**
 * SOAP 1.1 request envelope for getVersion.
 * - Uses http://schemas.xmlsoap.org/soap/envelope/ namespace
 * - Body contains <ns:getVersion/> with no child elements (operation takes no parameters)
 */
const soap11Envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ns="${NS}">
  <soapenv:Header/>
  <soapenv:Body>
    <ns:getVersion/>
  </soapenv:Body>
</soapenv:Envelope>`;

/**
 * SOAP 1.2 request envelope for getVersion.
 * - Uses http://www.w3.org/2003/05/soap-envelope namespace (different from 1.1)
 * - SOAPAction is embedded in the Content-Type header, not a separate header
 */
const soap12Envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope"
                  xmlns:ns="${NS}">
  <soapenv:Header/>
  <soapenv:Body>
    <ns:getVersion/>
  </soapenv:Body>
</soapenv:Envelope>`;

// ═══════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════

test.describe('@API SOAP Version Service', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // SOAP 1.1 tests
  // Headers required: Content-Type: text/xml  +  SOAPAction: urn:getVersion
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('SOAP 1.1 — getVersion', () => {

    test('returns HTTP 200', async ({ request }) => {
      // A successful SOAP call always returns 200 — even SOAP faults return
      // 200 in SOAP 1.1 (only the Envelope Body differs for error vs success).
      const res = await request.post(SOAP11_ENDPOINT, {
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
          SOAPAction: 'urn:getVersion',   // Required by SOAP 1.1 spec
        },
        data: soap11Envelope,
      });
      expect(res.status()).toBe(200);
    });

    test('response Content-Type is text/xml', async ({ request }) => {
      // Axis2 echoes text/xml for SOAP 1.1 responses — confirms we're talking
      // to the correct endpoint and not a proxy or error page.
      const res = await request.post(SOAP11_ENDPOINT, {
        headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: 'urn:getVersion' },
        data: soap11Envelope,
      });
      expect(res.headers()['content-type']).toContain('text/xml');
    });

    test('response body contains SOAP Envelope', async ({ request }) => {
      // Structural check: confirms the response is a proper SOAP message,
      // not HTML, plain text, or a different protocol's response.
      const res = await request.post(SOAP11_ENDPOINT, {
        headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: 'urn:getVersion' },
        data: soap11Envelope,
      });
      const body = await res.text();
      expect(body).toContain('soapenv:Envelope');
      expect(body).toContain('getVersionResponse');  // Confirms operation was dispatched correctly
    });

    test('version string contains "Axis2"', async ({ request }) => {
      // Validates the actual business value returned by the service.
      // The service is expected to return: "Hi - the Axis2 version is X.Y.Z"
      const res = await request.post(SOAP11_ENDPOINT, {
        headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: 'urn:getVersion' },
        data: soap11Envelope,
      });
      const version = extractVersion(await res.text());
      expect(version).toContain('Axis2');
    });

    test('version string contains a semver pattern', async ({ request }) => {
      // Checks that a version number (e.g. "1.6.2") is embedded in the response,
      // using a loose regex X.Y to accommodate any future version upgrades.
      const res = await request.post(SOAP11_ENDPOINT, {
        headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: 'urn:getVersion' },
        data: soap11Envelope,
      });
      const version = extractVersion(await res.text());
      expect(version).toMatch(/\d+\.\d+/);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  // SOAP 1.2 tests
  // Headers required: Content-Type: application/soap+xml with action= embedded
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('SOAP 1.2 — getVersion', () => {

    test('returns HTTP 200', async ({ request }) => {
      // SOAP 1.2 uses a different namespace and Content-Type compared to 1.1.
      // Verifies the Axis2 server correctly handles both protocol versions.
      const res = await request.post(SOAP12_ENDPOINT, {
        headers: {
          // In SOAP 1.2 the action is part of Content-Type, not a separate header
          'Content-Type': 'application/soap+xml; charset=UTF-8; action="urn:getVersion"',
        },
        data: soap12Envelope,
      });
      expect(res.status()).toBe(200);
    });

    test('response Content-Type is application/soap+xml', async ({ request }) => {
      // SOAP 1.2 servers must respond with application/soap+xml (not text/xml).
      // This distinguishes a genuine SOAP 1.2 response from a 1.1 fallback.
      const res = await request.post(SOAP12_ENDPOINT, {
        headers: { 'Content-Type': 'application/soap+xml; charset=UTF-8; action="urn:getVersion"' },
        data: soap12Envelope,
      });
      expect(res.headers()['content-type']).toContain('application/soap+xml');
    });

    test('version string matches SOAP 1.1 result', async ({ request }) => {
      // Both protocol versions must return identical business data — the version
      // string. Runs both calls in parallel to keep the test fast.
      const [r11, r12] = await Promise.all([
        request.post(SOAP11_ENDPOINT, {
          headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: 'urn:getVersion' },
          data: soap11Envelope,
        }),
        request.post(SOAP12_ENDPOINT, {
          headers: { 'Content-Type': 'application/soap+xml; charset=UTF-8; action="urn:getVersion"' },
          data: soap12Envelope,
        }),
      ]);
      const v11 = extractVersion(await r11.text());
      const v12 = extractVersion(await r12.text());
      expect(v11).toBe(v12);
    });

  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error / negative tests
  // Note: Axis2 sends a non-RFC-compliant HTTP response on errors (missing
  // CRLF after the status line), causing Playwright to throw a "Parse Error"
  // rather than returning a response object. Tests handle both paths.
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Error handling', () => {

    test('malformed XML is rejected by server', async ({ request }) => {
      // Sending plain text instead of XML should cause Axis2 to reject the
      // request. Due to the Axis2 HTTP response quirk (see file header),
      // this may surface as a thrown error rather than a 400/500 status.
      try {
        const res = await request.post(SOAP11_ENDPOINT, {
          headers: { 'Content-Type': 'text/xml; charset=UTF-8', SOAPAction: 'urn:getVersion' },
          data: 'this is not xml',
        });
        // If Playwright parses the response successfully, it must be an error status
        expect([400, 500]).toContain(res.status());
      } catch (err: any) {
        // Playwright threw because Axis2 returned a malformed HTTP response —
        // this also confirms the request was rejected
        expect(err.message).toMatch(/parse error|connect|network/i);
      }
    });

    test('missing SOAPAction header still returns 200 (server-side default)', async ({ request }) => {
      // Axis2 can resolve the operation from the SOAP Body element name alone
      // (document/literal binding). SOAPAction is technically required by the
      // SOAP 1.1 spec but Axis2 is lenient — useful to document this behaviour.
      const res = await request.post(SOAP11_ENDPOINT, {
        headers: { 'Content-Type': 'text/xml; charset=UTF-8' },  // No SOAPAction
        data: soap11Envelope,
      });
      expect(res.status()).toBe(200);
    });

    test('wrong Content-Type is rejected by server', async ({ request }) => {
      // Sending application/json tells Axis2 this is not a SOAP request.
      // Axis2 rejects it — same HTTP response quirk as the malformed XML case.
      try {
        const res = await request.post(SOAP11_ENDPOINT, {
          headers: { 'Content-Type': 'application/json', SOAPAction: 'urn:getVersion' },
          data: soap11Envelope,
        });
        expect(res.status()).not.toBe(200);
      } catch (err: any) {
        expect(err.message).toMatch(/parse error|connect|network/i);
      }
    });

  });

});
