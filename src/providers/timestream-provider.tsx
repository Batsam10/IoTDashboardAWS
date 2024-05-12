import * as qc from "@aws-sdk/client-timestream-query";
import * as wc from "@aws-sdk/client-timestream-write";
import { FC, createContext, useContext, useEffect, useState } from "react";
import { IProvider, IQuerySettings } from "../models/interfaces";
import { cleanName, convertValue } from "../utils";
import {
  database,
  machineStatusTable,
  vendEventsTable,
} from "../models/consts";

interface ITimeStreamContext {
  listDatabases: () => Promise<wc.ListDatabasesCommandOutput>;
  listTables: (db: string) => Promise<wc.ListTablesCommandOutput>;
  getMeasures: (db: string, table: string) => Promise<qc.QueryCommandOutput>;
  describeTable: (db: string, table: string) => Promise<qc.QueryCommandOutput>;
  query: (
    db: string,
    table: string,
    settings: IQuerySettings
  ) => Promise<{
    query: string;
    result: qc.QueryCommandOutput;
  }>;
  rawQuery: (q: string) => Promise<qc.QueryCommandOutput>;
  canQueryTimestream: boolean;
  loading: boolean;
}

const initChartContext: Partial<ITimeStreamContext> = {
  canQueryTimestream: false,
  loading: true
};

const TimestreamContext = createContext(initChartContext as ITimeStreamContext);

export function useTimeStream() {
  return useContext(TimestreamContext);
}

const TimestreamProvider: FC<IProvider> = ({ children, settings }) => {
  const { accessKeyId, region, secretAccessKey, sessionToken } = settings;
  const [canQueryTimestream, setCanQueryTimestream] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tsw, setTSW] = useState<wc.TimestreamWriteClient>(
    new wc.TimestreamWriteClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    })
  );

  const [tsq, setTSQ] = useState<qc.TimestreamQueryClient>(
    new qc.TimestreamQueryClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    })
  );

  useEffect(() => {
    if (!tsq) {
      setTSQ(
        new qc.TimestreamQueryClient({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
            sessionToken,
          },
        })
      );
    }

    if (!tsw) {
      setTSW(
        new wc.TimestreamWriteClient({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
            sessionToken,
          },
        })
      );
    }
  }, []);

  useEffect(() => {
    if (!tsw) {
        setLoading(false);
      return;
    }

    (async () => {
      const databases = await listDatabases();
      if (databases.Databases?.some((db) => db.DatabaseName === database)) {
        const tablesInDb = await listTables(database);
        const statusTableFound = tablesInDb?.Tables?.some(
          (tbl) => tbl.TableName === machineStatusTable
        );
        const vendEventsTableFound = tablesInDb?.Tables?.some(
          (tbl) => tbl.TableName === vendEventsTable
        );
        setCanQueryTimestream(!!vendEventsTableFound && !!statusTableFound);
      } else {
        setCanQueryTimestream(false);
      }
    })();
    setLoading(false);

  }, [tsw, tsq]);

  const listDatabases = async () => tsw.send(new wc.ListDatabasesCommand({}));

  const listTables = async (db: string) =>
    tsw.send(
      new wc.ListTablesCommand({
        DatabaseName: db,
        MaxResults: 20,
      })
    );

  const getMeasures = (db: string, table: string) =>
    tsq?.send(
      new qc.QueryCommand({
        QueryString: `SHOW MEASURES IN "${db}"."${table}"`,
      })
    );

  const describeTable = (db: string, table: string) =>
    tsq?.send(
      new qc.QueryCommand({
        QueryString: `DESCRIBE "${db}"."${table}"`,
      })
    );

  const query = async (db: string, table: string, settings: IQuerySettings) => {
    const conditions = (settings.filters || []).filter(
      (q) => q.dimention && q.operator && q.value
    );

    const q = `
      SELECT 
        ${
          settings.groupInterval
            ? `bin(time, ${settings.groupInterval}) as time`
            : "time"
        },
        ${settings.measures
          .map(
            (p) =>
              `${
                settings.groupInterval ? settings.groupAggregation : ""
              }(CASE WHEN measure_name = '${p.name}' THEN measure_value::${
                p.type
              } ELSE NULL END) as ${cleanName(p.name)}`
          )
          .join(", ")}
    FROM "${db}"."${table}"
    WHERE time >= ago(${settings.interval})
    AND measure_name IN (${settings.measures
      .map((p) => `'${p.name}'`)
      .join(",")})
    ${conditions.length > 0 ? "AND" : ""}
    ${conditions
      .map(
        (f) =>
          `${f.dimention.name} ${f.operator} ${convertValue(
            f.dimention.type,
            f.value
          )}`
      )
      .join(" AND ")}
    ${
      settings.groupInterval
        ? `GROUP BY bin(time, ${settings.groupInterval})`
        : ""
    }
    ORDER BY time DESC
    `;

    return {
      query: q,
      result: await tsq?.send(new qc.QueryCommand({ QueryString: q })),
    };
  };

  const rawQuery = (q: string) =>
    tsq?.send(new qc.QueryCommand({ QueryString: q }));

  const value: ITimeStreamContext = {
    listDatabases,
    listTables,
    getMeasures,
    describeTable,
    query,
    rawQuery,
    canQueryTimestream,
    loading
  };

  return (
    <TimestreamContext.Provider value={value}>
      {children}
    </TimestreamContext.Provider>
  );
};

export default TimestreamProvider;
